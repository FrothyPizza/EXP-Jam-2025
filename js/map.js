
/*
    The Map class handles:
    - Loading and parsing a Tiled map XML file.
    - Creating an offscreen canvas for each layer to optimize rendering.
    - Storing game objects like enemies, spawn points, and crate locations.
    - Providing methods for drawing the map and checking collisions.
*/
class Map {
    constructor(xml) {
        this.xml = xml;
        this.layers = {};
        // Offscreen cache for each static layer.
        this.layerCache = {};
        this.tilesetImage = Loader.tilesetImage;

        // Game objects and spawn points.
        this.enemies = [];
        this.bossCues = [];
        this.crateLocations = [];
        this.playerSpawn = { x: 0, y: 0 };

        // Process object groups.
        xml.querySelectorAll("objectgroup").forEach((group) => {
            group.querySelectorAll("object").forEach((object) => {
                if (group.getAttribute("name") === "Spawns") {
                    if (object.getAttribute("name") === "PlayerSpawn") {
                        this.playerSpawn.x = parseInt(object.getAttribute("x"));
                        this.playerSpawn.y = parseInt(object.getAttribute("y"));
                    }
                }
                if (group.getAttribute("name") === "Enemies") {
                    this.enemies.push({
                        name: object.getAttribute("name"),
                        x: parseInt(object.getAttribute("x")),
                        y: parseInt(object.getAttribute("y")),
                    });
                }
                if (group.getAttribute("name") === "BossCues") {
                    this.bossCues.push({
                        name: object.getAttribute("name"),
                        x: parseInt(object.getAttribute("x")),
                        y: parseInt(object.getAttribute("y")),
                        width: parseInt(object.getAttribute("width")),
                        height: parseInt(object.getAttribute("height")),
                    });
                }
                if (group.getAttribute("name") === "CrateLocations") {
                    this.crateLocations.push({
                        x: parseInt(object.getAttribute("x")),
                        y: parseInt(object.getAttribute("y")),
                    });
                }
            });
        });

        // Get map attributes and convert numeric ones.
        xml.querySelector("map").getAttributeNames().forEach((attr) => {
            this[attr] = xml.querySelector("map").getAttribute(attr);
            if (!isNaN(this[attr])) this[attr] = parseInt(this[attr]);
        });

        // Parse each layer and build its offscreen cache.
        xml.querySelectorAll("layer").forEach((layer) => {
            let layerName = layer.getAttribute("name");
            let dataArray = layer
                .querySelector("data")
                .innerHTML.split(",")
                .map((t) => parseInt(t));
            this.layers[layerName] = dataArray;
            this.layerCache[layerName] = this.createLayerCanvas(dataArray);
        });
    }

    // Pre-renders the entire layer onto an offscreen canvas.
    createLayerCanvas(layerData) {
        let offscreenCanvas = document.createElement("canvas");
        offscreenCanvas.width = this.width * this.tilewidth;
        offscreenCanvas.height = this.height * this.tileheight;
        let ctx = offscreenCanvas.getContext("2d");

        // Precalculate the number of tiles per row in the tileset image.
        const tilesPerRow = Loader.tilesetImage.naturalWidth / this.tilewidth;

        // Draw every tile onto the offscreen canvas.
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                let tile = layerData[y * this.width + x];
                if (tile === 0) continue; // Skip empty tiles.
                tile--; // Adjust for zero-based indexing.

                let tileX = tile % tilesPerRow;
                let tileY = Math.floor(tile / tilesPerRow);

                ctx.drawImage(
                    Loader.tilesetImage,
                    tileX * this.tilewidth,
                    tileY * this.tileheight,
                    this.tilewidth,
                    this.tileheight,
                    x * this.tilewidth,
                    y * this.tileheight,
                    this.tilewidth,
                    this.tileheight
                );
            }
        }

        return offscreenCanvas;
    }

    // Optimized drawing method using the pre-rendered offscreen canvases.
    // Assumes that context.view exists and defines { x, y } offsets,
    // and that context.canvas gives the drawing canvas dimensions.
    draw(context) {
        const view = context.view;
        const canvasWidth = context.canvas.width;
        const canvasHeight = context.canvas.height;

        // Draw each layer with a single drawImage call.
        Object.keys(this.layerCache).forEach((layerName) => {
            let cacheCanvas = this.layerCache[layerName];
            let paralaxFactor = 1.0; // Default parallax factor.
            if(layerName === "Background_3")
                paralaxFactor = 0.5; // Adjust parallax for specific layers.
            // Adjust the source x and y positions based on the layer's parallax factor.
            const sourceX = Math.floor(view.x * paralaxFactor);
            const sourceY = Math.floor(view.y * paralaxFactor);
            // Draw the cached layer image onto the main canvas.
            context.drawImage(
                cacheCanvas,
                sourceX, // Source x: adjusted for parallax.
                sourceY, // Source y: adjusted for parallax.
                canvasWidth, // Source width: match canvas dimensions.
                canvasHeight, // Source height.
                0, // Destination x (draw at canvas top-left).
                0, // Destination y.
                canvasWidth, // Destination width.
                canvasHeight // Destination height.
            );

            // context.drawImage(
            //     cacheCanvas,
            //     view.x, // Source x: start drawing from the viewport's x position.
            //     view.y, // Source y: start drawing from the viewport's y position.
            //     canvasWidth, // Source width: match canvas dimensions.
            //     canvasHeight, // Source height.
            //     0, // Destination x (draw at canvas top-left).
            //     0, // Destination y.
            //     canvasWidth, // Destination width.
            //     canvasHeight // Destination height.
            // );
        });
    }

    // Retained for special-case, per-tile drawing if needed.
    drawTile(context, tile, x, y) {
        if (tile === 0) return;
        tile--;
        const tileSize = this.tilewidth;
        const tilesPerRow = Loader.tilesetImage.naturalWidth / tileSize;
        let tileX = tile % tilesPerRow;
        let tileY = Math.floor(tile / tilesPerRow);

        context.drawImage(
            Loader.tilesetImage,
            tileX * tileSize,
            tileY * tileSize,
            tileSize,
            tileSize,
            x - context.view.x,
            y - context.view.y,
            tileSize,
            tileSize
        );
    }

    // Collision detection methods remain unchanged.
    pointIsCollidingWithType(x, y, type) {
        if (x < 0 || y < 0 || x > this.width * this.tilewidth - 1 || y > this.height * this.tileheight)
            return false;
        x = Math.round(x);
        y = Math.round(y);
        let layerData = this.layers["Collision"];
        let tile =
            layerData[Math.floor(y / this.tileheight) * this.width +
            Math.floor(x / this.tilewidth)];
        return Loader.tilesetData.getTileClass(tile) === type;
    }

    pointIsCollidingWithWall(x, y) {
        return this.pointIsCollidingWithType(x, y, "wall");
    }

    pointIsCollidingWithSpikes(x, y) {
        return this.pointIsCollidingWithType(x, y, "damage");
    }

    // Loops over blocks in the specified area and finds ground blocks.
    findAllGroundBlocksInScreenBounds(x, y) {
        let blocks = [];
        let blockX = Math.floor(x / this.tilewidth);
        let blockY = Math.floor(y / this.tileheight);
        console.log(blockX, blockY);
        for (let i = blockX + 1; i < blockX + WIDTH / this.tilewidth; i++) {
            for (let j = blockY + 1; j < blockY + HEIGHT / this.tileheight; j++) {
                if (
                    this.pointIsCollidingWithWall(i * this.tilewidth, j * this.tileheight) &&
                    !this.pointIsCollidingWithWall(i * this.tilewidth, (j - 1) * this.tileheight) &&
                    !this.pointIsCollidingWithSpikes(i * this.tilewidth, (j - 1) * this.tileheight)
                ) {
                    blocks.push({ x: i * this.tilewidth, y: j * this.tileheight - 8 });
                }
            }
        }
        return blocks;
    }
}
