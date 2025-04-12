const FLAGS = {
    diagonal: 0x20000000,
    horizontal: 0x80000000,
    vertical: 0x40000000,
};

class Map {
    constructor(xml) {
        this.xml = xml;
        this.layers = {};
        this.tilesetImage = Loader.tilesetImage;

        // {name, x, y}
        this.enemies = [];
        this.bossCues = [];
        this.crateLocations = [];

        this.playerSpawn = {x: 0, y: 0};
        // this.levelComplete = {x: 0, y: 0, width: 0, height: 0};
        xml.querySelectorAll("objectgroup").forEach((group) => {
            group.querySelectorAll("object").forEach((object) => {
                if(group.getAttribute("name") == "Spawns") {
                    if(object.getAttribute("name") == "PlayerSpawn") {
                        this.playerSpawn.x = parseInt(object.getAttribute("x"));
                        this.playerSpawn.y = parseInt(object.getAttribute("y"));
                    }
                }
                if(group.getAttribute("name") == "Enemies") {
                    this.enemies.push({
                        name: object.getAttribute("name"),
                        x: parseInt(object.getAttribute("x")),
                        y: parseInt(object.getAttribute("y")),
                    });
                }
                if(group.getAttribute("name") == "BossCues") {
                    this.bossCues.push({
                        name: object.getAttribute("name"),
                        x: parseInt(object.getAttribute("x")),
                        y: parseInt(object.getAttribute("y")),
                        width: parseInt(object.getAttribute("width")),
                        height: parseInt(object.getAttribute("height")),
                    });
                }
                if(group.getAttribute("name") == "CrateLocations") {
                    this.crateLocations.push({
                        x: parseInt(object.getAttribute("x")),
                        y: parseInt(object.getAttribute("y")),
                    });
                }

            });
        });
        
        xml.querySelector("map").getAttributeNames().forEach((attr) => {
            this[attr] = xml.querySelector("map").getAttribute(attr);
            // convert to integer if possible
            if(!isNaN(this[attr])) this[attr] = parseInt(this[attr]);
        });

        xml.querySelectorAll("layer").forEach((layer) => {
            this.layers[layer.getAttribute("name")] = [];
            layer.querySelector("data").innerHTML.split(",").forEach((tile) => {
                this.layers[layer.getAttribute("name")].push(parseInt(tile));
            });
        });
    }

    resolveTile(tile) {
        let result = {};
        if (tile & FLAGS.diagonal) {
            result.diagonal = true;
        }
        if (tile & FLAGS.horizontal) {
            result.horizontal = true;
        }
        if (tile & FLAGS.vertical) {
            result.vertical = true;
        }
        result.tile = tile & 0x1FFFFFFF;
        return result;
    }

    drawTile(context, tile, x, y) {
        let resolved = this.resolveTile(tile);

        if(resolved.tile == 0) return;
        resolved.tile--;

        let tileSize = this.tilewidth;
        let tileX = resolved.tile % (Loader.tilesetImage.naturalWidth / tileSize);
        let tileY = Math.floor(resolved.tile / (Loader.tilesetImage.naturalWidth / tileSize));


    
        context.save();
        context.translate(x + tileSize / 2, y + tileSize / 2);
        context.scale(resolved.horizontal ? -1 : 1, resolved.vertical ? -1 : 1);
        context.rotate(resolved.diagonal ? -Math.PI / 2 : 0);
        context.scale(resolved.diagonal ? -1 : 1, 1);
        context.translate(-(x + tileSize / 2), -(y + tileSize / 2));
        context.drawImage(Loader.tilesetImage, tileX * tileSize, tileY * tileSize, tileSize, tileSize, x - context.view.x, y - context.view.y, tileSize, tileSize);
        context.restore();


    }


    draw(context) {
        // this.layers.forEach((layer) => {
        Object.keys(this.layers).forEach((layer) => {
            let layerData = this.layers[layer];
            let lowerBoundX = Math.floor(context.view.x / this.tilewidth);
            let lowerBoundY = Math.floor(context.view.y / this.tileheight);
            let upperBoundX = Math.ceil((context.view.x + context.canvas.width) / this.tilewidth);
            let upperBoundY = Math.ceil((context.view.y + context.canvas.height) / this.tileheight);
            
            for(let y = lowerBoundY; y < upperBoundY; y++) {
                for(let x = lowerBoundX; x < upperBoundX; x++) {
                    if(x < 0 || y < 0 || x >= this.width || y >= this.height) continue;
                    let tile = layerData[y * this.width + x];
                    this.drawTile(context, tile, x * this.tilewidth, y * this.tileheight);
                }
            }
            
            // for(let y = 0; y < this.height; y++) {
            //     for(let x = 0; x < this.width; x++) {
                    
            //         let tile = layerData[y * this.width + x];
            //         this.drawTile(context, tile, x * this.tilewidth, y * this.tileheight);
            //     }
            // }
        });
    }

    // pointIsCollidingWithWall(x, y) {
    //     if(x < 0 || y < 0 || x > this.width * this.tilewidth - 1 || y > this.height * this.tileheight - 1) return false;
    //     x = Math.round(x);
    //     y = Math.round(y);
    //     let layerData = this.layers["Collision"];
    //     let tile = layerData[Math.floor(y / this.tileheight) * this.width + Math.floor(x / this.tilewidth)] & 0x1FFFFFFF;
    //     return Loader.tilesetData.getTileClass(tile) == "wall";
    // }

    // pointIsCollidingWithSpikes(x, y) {
    //     if(x < 0 || y < 0 || x > this.width * this.tilewidth || y > this.height * this.tileheight) return false;
    //     x = Math.round(x);
    //     y = Math.round(y);
    //     let layerData = this.layers["Collision"];
    //     let tile = this.resolveTile(layerData[Math.floor(y / this.tileheight) * this.width + Math.floor(x / this.tilewidth)]);

    //     return Loader.tilesetData.getTileClass(tile.tile) === "damage";
    // }

    pointIsCollidingWithType(x, y, type) {
        if(x < 0 || y < 0 || x > this.width * this.tilewidth - 1 || y > this.height * this.tileheight) return false;
        x = Math.round(x);
        y = Math.round(y);
        let layerData = this.layers["Collision"];
        let tile = this.resolveTile(layerData[Math.floor(y / this.tileheight) * this.width + Math.floor(x / this.tilewidth)]);
        return Loader.tilesetData.getTileClass(tile.tile) === type;
    }

    pointIsCollidingWithWall(x, y) {
        return this.pointIsCollidingWithType(x, y, "wall");
    }

    pointIsCollidingWithSpikes(x, y) {
        return this.pointIsCollidingWithType(x, y, "damage");
    }


    // loops over all blocks in x: (x, x + WIDTH) and y: (y, y + HEIGHT)
    // returns all block that are a wall and have nothing above it
    findAllGroundBlocksInScreenBounds(x, y) {
        let blocks = [];
        let blockX = Math.floor((x) / this.tilewidth);
        let blockY = Math.floor((y) / this.tileheight);
        console.log(blockX, blockY);
        for(let i = blockX + 1; i < blockX + WIDTH / this.tilewidth; i++) {
            for(let j = blockY + 1; j < blockY + HEIGHT / this.tileheight; j++) {
                if(this.pointIsCollidingWithWall(i * this.tilewidth, j * this.tileheight) && !this.pointIsCollidingWithWall(i * this.tilewidth, (j - 1) * this.tileheight) && !this.pointIsCollidingWithSpikes(i * this.tilewidth, (j - 1) * this.tileheight)) {
                    blocks.push({x: i * this.tilewidth, y: j * this.tileheight - 8});
                }
            }
        }
        return blocks;
    }

}