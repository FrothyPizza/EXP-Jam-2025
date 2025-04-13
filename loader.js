// loader.js

const Loader = {
    images: {},
    fonts: {},
    spriteSheets: {},
    levels: {},
    tilesetImage: null,
    tilesetData: null,
    gameWorld: null,
    audio: {},
    music: {},

    load: async function() {
        let promises = [];
        for (let i = 0; i < arguments.length; i++) {
            let src = arguments[i];
            let ext = src.split('.').pop().toLowerCase();
            if (ext === 'png' || ext === 'jpg' || ext === 'jpeg' || ext === 'gif') {
                promises.push(this.loadImage(src));
            } else if (ext === 'json') {
                promises.push(this.loadSpriteSheet(src));
            } else if (ext === 'tmx') {
                promises.push(this.loadMap(src));
            } else if (ext === 'tsx') {
                promises.push(this.loadTileset(src));
            } else if (ext === 'world') {
                promises.push(this.loadWorld(src));
            } else if (ext === 'js') {
                promises.push(this.loadSpriteSheetJS(src));
            } else if (ext === 'ttf') {
                console.log("Loading font: " + src);
                promises.push(this.loadFont(src));
            } else if (ext === 'wav' || ext === 'mp3' || ext === 'm4a') {
                promises.push(this.loadAudio(src));
            }
        }

        await Promise.all(promises);
    },

    loadMap: function(src) {
        return new Promise((resolve, reject) => {
            fetch(src)
                .then(response => response.text())
                .then(data => {
                    let parser = new DOMParser();
                    let xml = parser.parseFromString(data, 'text/xml');
                    let map = new Map(xml);
                    this.levels[src.split('/').pop().split('.')[0]] = map;
                    resolve();
                })
                .catch(error => {
                    reject(error);
                });
        }); 
    },

    loadTileset: function(src) {
        return new Promise((resolve, reject) => {
            fetch(src)
                .then(response => response.text())
                .then(data => {
                    let parser = new DOMParser();
                    let xml = parser.parseFromString(data, 'text/xml');
                    this.tilesetData = xml;
                    this.tilesetData.getTileClass = function(tileId) {
                        let tile = this.querySelector(`tile[id="${tileId-1}"]`);
                        if (tile) {
                            let type = tile.getAttribute("type");
                            return type;
                        }
                        return "empty";                        
                    };
                    resolve();
                })
                .catch(error => {
                    reject(error);
                });
        });
    },

    loadWorld: function(src) {
        return new Promise((resolve, reject) => {
            fetch(src)
                .then(response => response.text())
                .then(data => {
                    this.gameWorld = JSON.parse(data);
                    resolve();
                })
                .catch(error => {
                    reject(error);
                });
        });
    },

    loadImage: function(src) {
        return new Promise((resolve, reject) => {
            let img = new Image();
            img.src = src;
            img.onload = () => {
                this.images[this.removePath(src)] = img;
                resolve();
            }
            img.onerror = () => {
                reject();
            }
        });
    },

    loadSpriteSheet: function(src) {
        return new Promise((resolve, reject) => {
            fetch(src)
                .then(response => response.json())
                .then(data => {
                    let img = new Image();
                    let path = src.split('/');
                    this.spriteSheets[path.pop().split('.')[0]] = data;
                    path = path.join('/');
                    img.src = path + '/' + data.meta.image;
                    img.onload = () => {
                        this.images[data.meta.image] = img;
                        resolve();
                    }
                    img.onerror = () => {
                        reject();
                    }
                })
                .catch(error => {
                    reject(error);
                });
        });
    },

    loadFont: function(src) {
        return new Promise((resolve, reject) => {
            let font = new FontFace(src, `url(${src})`);
            font.load().then(loadedFace => {
                document.fonts.add(loadedFace);
                this.fonts[src] = loadedFace;
                console.log("Font loaded: " + src);
                resolve();
            }).catch(error => {
                reject();
            });
        });
    },

    loadSpriteSheetJS: function(src) {
        return new Promise((resolve, reject) => {
            console.log("Loading spritesheet: " + src);
            let img = new Image();
            let path = src.split('/');
            let name = path.pop().split('.')[0];
            this.spriteSheets[name] = window[name];
            path = path.join('/');
            img.src = path + '/' + this.spriteSheets[name].meta.image;
            img.onload = () => {
                this.images[this.spriteSheets[name].meta.image] = img;
                resolve();
            }
            img.onerror = () => {
                reject();
            }
        });
    },

    loadAudio: function(src) {
        return new Promise((resolve, reject) => {
            const audio = new Audio();
            audio.src = src;
            audio.addEventListener('canplaythrough', () => {
                this.audio[this.removePath(src)] = audio;
                resolve();
            }, { once: true });

            audio.onerror = () => {
                reject(`Error loading audio: ${src}`);
            };
        });
    },

    removePath: function(src) {
        let path = src.split('/'); 
        return path.pop();
    },

    // playSound: function(name, volume = 1) {
    //     // Create a new instance of the sound to allow multiple overlaps
    //     if (this.audio[name]) {
    //         const soundClone = this.audio[name].cloneNode(true);
    //         soundClone.volume = volume;
    //         // If we play a sound that's already playing, this will start another instance
    //         soundClone.currentTime = 0;
    //         soundClone.play();
    //     } else {
    //         console.warn(`Sound ${name} not found.`);
    //     }
    // },
    playSound: function(name, volume = 1) {
        // Check if the audio exists
        if (this.audio[name]) {
            const sound = this.audio[name];
            
            // Set the desired volume
            sound.volume = volume;
            
            // If the sound is already playing, reset it to start
            if (!sound.paused) {
                sound.currentTime = 0;
            }
            
            // Play the sound
            sound.play().catch(error => {
                console.warn(`Failed to play sound ${name}:`, error);
            });
        } else {
            console.warn(`Sound "${name}" not found.`);
        }
    },
    playSoundRepeat: function(name, volume, repeatTimes) {
        if (this.audio[name]) {
            const sound = this.audio[name];
            sound.volume = volume;
            if (!sound.paused) {
                sound.currentTime = 0;
            }
            sound.play().catch(error => {
                console.warn(`Failed to play sound ${name}:`, error);
            });
            sound.onended = () => {
                repeatTimes--;
                if(repeatTimes > 0) {
                    sound.currentTime = 0;
                    sound.play().catch(error => {
                        console.warn(`Failed to play sound ${name}:`, error);
                    });
                }
            }
        } else {
            console.warn(`Sound "${name}" not found.`);
        }
    },
    

    playMusic: function(name, volume = 1, restart = true) {
        // Stop any music that is currently playing, unless it's the same music
        for (let key in this.music) {
            if (key !== name) {
                this.music[key].pause();
                this.music[key].currentTime = 0;
            }
        }
    
        if (this.audio[name]) {
            if (this.music[name]) {
                if (!restart) {
                    if (!this.music[name].paused) {
                        // Music is already playing and restart is false, do nothing
                        return;
                    } else {
                        // Music is paused and restart is false, so restart it
                        this.music[name].currentTime = 0;
                        this.music[name].play();
                        return;
                    }
                }
                // If restart is true, stop the current music to restart it
                this.music[name].pause();
                this.music[name].currentTime = 0;
            }
    
            // Clone the audio node to allow multiple instances if needed
            const musicClone = this.audio[name].cloneNode(true);
            musicClone.loop = true;
            musicClone.volume = volume;
            musicClone.play();
            this.music[name] = musicClone;
        } else {
            console.warn(`Music ${name} not found.`);
        }
    },
    

    setCurrentMusicVolume: function(volume) {
        for (let key in this.music) {
            this.music[key].volume = volume;
        }
    },

    setCurrentMusicSpeed: function(speed) {
        for (let key in this.music) {
            this.music[key].playbackRate = speed;
        }
    },

    decreaseCurrentMusicVolume: function(value) {
        for (let key in this.music) {
            if(this.music[key].volume - value < 0) {
                this.music[key].volume = 0;
            } else {
                this.music[key].volume -= value;
            }
        }
    },
};

// console.log("AAAA");

document.body.onload = () => {
    setTimeout(() => {
        Loader.load(
            
            'assets/fonts/font.png',
            'assets/fonts/font4x8.png',
            

            'assets/images/player/Theo.json',


            'assets/images/enemies/fly.json',
            'assets/images/enemies/Demon.json',
            'assets/images/enemies/Hades.json',
            'assets/images/enemies/Harpy.json',
            'assets/images/enemies/Hellhound.json',

            'assets/images/enemies/Flag.json',

            'assets/images/enemies/spirit_walker.json',
            'assets/images/enemies/Charon.json',
            'assets/images/enemies/waterfall.json',
            'assets/images/enemies/waterfall_background.json',


            'tiled/GameJamSpriteSheet.tsx',
            'tiled/new-tiles.png',
            'tiled/GameJamSpriteSheet.png',
            'tiled/levels/game_world.world',

            



            'assets/music/River Styx.mp3',
            'assets/music/Charon-Boss Fight.mp3',





            'assets/sfx/sam/powerup2.wav',
            'assets/sfx/sam/damage.wav',
            'assets/sfx/sam/hit.wav',
            'assets/sfx/sam/jump.wav',
            'assets/sfx/sam/playerDamage.wav',
            'assets/sfx/sam/powerup.wav',
            'assets/sfx/sam/dash01.wav',
            'assets/sfx/turtle_laser.wav',


            'assets/sfx/DogBarkDash.wav',
            'assets/sfx/EvilLaugh.wav',
            'assets/sfx/fistSlam1.wav',
            'assets/sfx/fistSlam2.wav',
            'assets/sfx/ghost summon 2.wav',
            'assets/sfx/ghost summon1.wav',
            'assets/sfx/Slash.wav',
            'assets/sfx/Wing flap (3).wav',
            'assets/sfx/unicyclist_death.wav',


            

            // 'assets/music/unicyclist_theme.mp3',

        ).then(() => {
            let levels = [];
            for (let i = 0; i < Loader.gameWorld.maps.length; i++) {
                levels.push('tiled/levels/' + Loader.gameWorld.maps[i].fileName);
            }
            Loader.tilesetImage = Loader.images['GameJamSpriteSheet.png'];

            Loader.load(...levels).then(() => {
                init();
            });
        });
    }, 100);
}    



if(!localStorage.getItem('VERSION')) {
    localStorage.clear();
    localStorage.setItem('VERSION', CONSTANTS.VERSION);
}

// CONSTANTS.unlockedLevels = ['level_run_1'];
// // load from local storage
// if(localStorage.getItem('unlockedLevels')) {
//     CONSTANTS.unlockedLevels = JSON.parse(localStorage.getItem('unlockedLevels'));
//     // CONSTANTS.unlockedLevels = ['level_hoopoe', 'level_7', 'level_1', 'level_5', 'level_corgi', 'level_run_1', 'level_run_2'];

// } else {
//     // CONSTANTS.unlockedLevels = ['level_hoopoe', 'level_7', 'level_1', 'level_5', 'level_corgi', 'level_run_1'];
//     localStorage.setItem('unlockedLevels', JSON.stringify(CONSTANTS.unlockedLevels));
// }

// if(localStorage.getItem('completedLevels')) {
//     CONSTANTS.completedLevels = JSON.parse(localStorage.getItem('completedLevels'));
// } else {
//     localStorage.setItem('completedLevels', JSON.stringify([]));
// }

// function unlockLevelLocalStorage(levelName) {
//     if(!CONSTANTS.unlockedLevels.includes(levelName)) {
//         CONSTANTS.unlockedLevels.push(levelName);
//         localStorage.setItem('unlockedLevels', JSON.stringify(CONSTANTS.unlockedLevels));
//     }
// }
// function completeLevelLocalStorage(levelName) {
//     if(!CONSTANTS.completedLevels.includes(levelName)) {
//         CONSTANTS.completedLevels.push(levelName);
//         localStorage.setItem('completedLevels', JSON.stringify(CONSTANTS.completedLevels));
//     }
// }

// function unlockAllLevels() {
//     CONSTANTS.unlockedLevels = ['level_hoopoe', 'level_7', 'level_1', 'level_5', 'level_corgi', 'level_run_1', 'level_run_2'];
//     localStorage.setItem('unlockedLevels', JSON.stringify(CONSTANTS.unlockedLevels));
// }