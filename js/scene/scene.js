// Scene.js

class Scene {

    constructor() {

        // Bitmap font related properties
        this.charWidth = 4;
        this.charHeight = 8;
        this.bitmapFontImage = Loader.images['font4x8.png'];
        this.bitmapFontMap = this.createBitmapFontMap();

        this.offScreenCanvas = document.createElement('canvas');
        this.offScreenCanvas.width = this.charWidth;
        this.offScreenCanvas.height = this.charHeight;
        this.offScreenContext = this.offScreenCanvas.getContext('2d');
    }


    wrapText(text, maxWidth) {
        const words = text.split(' ');
        const lines = [];
        let currentLine = '';

        for (let word of words) {
            const testLine = currentLine + (currentLine === '' ? '' : ' ') + word;
            const testWidth = this.measureBitmapTextWidth(testLine);
            if (testWidth > maxWidth && currentLine !== '') {
                lines.push(currentLine);
                currentLine = word;
            } else {
                currentLine = testLine;
            }
        }
        if (currentLine !== '') {
            lines.push(currentLine);
        }
        return lines;
    }

    measureBitmapTextWidth(text) {
        let width = 0;
        for (let char of text) {
            const glyph = this.bitmapFontMap[char] || this.bitmapFontMap[' '];
            width += glyph.width;
        }
        return width;
    }


    drawBitmapText(context, text, x, y, align = 'left', color = '', highlight = '') {
        let offsetX = 0;
        if (align === 'center') {
            const textWidth = this.measureBitmapTextWidth(text);
            offsetX -= textWidth / 2;
        } else if (align === 'right') {
            const textWidth = this.measureBitmapTextWidth(text);
            offsetX -= textWidth;
        }
    
        // Create an off-screen canvas once
        if (!this.offScreenCanvas) {
            this.offScreenCanvas = document.createElement('canvas');
            this.offScreenCanvas.width = this.charWidth;
            this.offScreenCanvas.height = this.charHeight;
            this.offScreenContext = this.offScreenCanvas.getContext('2d');
        }
    
        // Cache for recolored glyphs
        if (!this.glyphCache) {
            this.glyphCache = {};
        }
    
        for (let char of text) {
            const glyph = this.bitmapFontMap[char] || this.bitmapFontMap[' '];
            if (!glyph) {
                console.warn(`Glyph for character '${char}' not found.`);
                continue;
            }
    
            if (highlight !== '') {
                // Draw a colored rectangle behind the text
                context.fillStyle = highlight;
                context.fillRect(x + offsetX - 1, y - 1, glyph.width + 1, glyph.height + 1);
            }
    
            // Generate a cache key based on character and color
            const cacheKey = `${char}_${color}`;
    
            let imageToDraw;
    
            if (this.glyphCache[cacheKey]) {
                // Use cached glyph image
                imageToDraw = this.glyphCache[cacheKey];
            } else {
                // Clear the off-screen canvas
                this.offScreenContext.clearRect(0, 0, this.charWidth, this.charHeight);
    
                // Draw the glyph onto the off-screen canvas
                this.offScreenContext.drawImage(
                    this.bitmapFontImage,
                    glyph.x, glyph.y, glyph.width, glyph.height,
                    0, 0, glyph.width, glyph.height
                );
    
                if (color !== '') {
                    // Recolor the glyph
                    this.offScreenContext.globalCompositeOperation = 'source-in';
                    this.offScreenContext.fillStyle = color;
                    this.offScreenContext.fillRect(0, 0, glyph.width, glyph.height);
                    this.offScreenContext.globalCompositeOperation = 'source-over';
                }
    
                // Cache the recolored glyph
                imageToDraw = new Image();
                imageToDraw.src = this.offScreenCanvas.toDataURL();
                this.glyphCache[cacheKey] = imageToDraw;
            }
    
            // Draw the glyph onto the main context
            context.drawImage(
                imageToDraw,
                0, 0, glyph.width, glyph.height,
                Math.floor(x + offsetX), Math.floor(y),
                glyph.width, glyph.height
            );
    
            offsetX += glyph.width;
        }
    }
    
    

    createBitmapFontMap() {
        const chars = ` ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789.,''''"'?!@_*:$%+-/:;<=>`;
        const charArray = chars.split('');
        const fontMap = {};
        for (let i = 0; i < charArray.length; i++) {
            const char = charArray[i];
            fontMap[char] = {
                x: i * this.charWidth,
                y: 0,
                width: this.charWidth,
                height: this.charHeight
            };
        }
        // console.log('Bitmap Font Map:', fontMap);
        return fontMap;
    }
}
