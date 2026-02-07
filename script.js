const canvas = document.getElementById('pixelCanvas');
const ctx = canvas.getContext('2d');
const colorPicker = document.getElementById('colorPicker');
const toolLabel = document.getElementById('current-tool');

// Canvas Settings
// Real resolution is 32x32, but CSS scales it to 512x512
const RES = 32; 
const SCALE = 512 / RES; // 16 screen pixels = 1 canvas pixel

let isDrawing = false;
let currentTool = 'pencil'; // pencil, eraser, bucket

// 1. Initialize Canvas (Transparent)
ctx.fillStyle = 'rgba(0,0,0,0)';
ctx.fillRect(0, 0, RES, RES);

// 2. Tool Switching
function setTool(tool) {
    currentTool = tool;
    toolLabel.innerText = tool.charAt(0).toUpperCase() + tool.slice(1);
    
    // UI Updates
    document.querySelectorAll('button').forEach(b => b.classList.remove('active'));
    document.getElementById(`tool-${tool}`).classList.add('active');
}

// 3. Mouse Coordinate Mapper
function getPos(e) {
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / (rect.width / RES));
    const y = Math.floor((e.clientY - rect.top) / (rect.height / RES));
    return { x, y };
}

// 4. Drawing Logic
function draw(e) {
    const { x, y } = getPos(e);
    if (x < 0 || x >= RES || y < 0 || y >= RES) return;

    if (currentTool === 'bucket') {
        fill(x, y, colorPicker.value);
    } else {
        // Pencil or Eraser
        ctx.fillStyle = currentTool === 'eraser' ? 'rgba(0,0,0,0)' : colorPicker.value;
        // clearRect allows eraser to make it transparent again
        if(currentTool === 'eraser') ctx.clearRect(x, y, 1, 1);
        else ctx.fillRect(x, y, 1, 1);
    }
}

// 5. THE FLOOD FILL ALGORITHM (Secret Sauce)
function fill(startX, startY, newColor) {
    // Get current pixel color
    const pixel = ctx.getImageData(startX, startY, 1, 1).data;
    
    // Convert to Hex to compare easily
    const startColor = rgbToHex(pixel[0], pixel[1], pixel[2], pixel[3]);
    
    if (startColor === newColor) return; // Same color, do nothing

    const stack = [[startX, startY]];
    
    // Safety break to prevent infinite loops (though stack prevents this mostly)
    let iterations = 0;

    while (stack.length > 0 && iterations < RES * RES) {
        iterations++;
        const [x, y] = stack.pop();

        const currPixel = ctx.getImageData(x, y, 1, 1).data;
        const currColor = rgbToHex(currPixel[0], currPixel[1], currPixel[2], currPixel[3]);

        if (currColor === startColor) {
            // Paint Pixel
            ctx.fillStyle = newColor;
            ctx.fillRect(x, y, 1, 1);

            // Add neighbors to stack (Up, Down, Left, Right)
            if (x + 1 < RES) stack.push([x + 1, y]);
            if (x - 1 >= 0) stack.push([x - 1, y]);
            if (y + 1 < RES) stack.push([x, y + 1]);
            if (y - 1 >= 0) stack.push([x, y - 1]);
        }
    }
}

// Helper: RGB to Hex
function rgbToHex(r, g, b, a) {
    if (a === 0) return '#000000'; // Treat transparent as black for now (simplified)
    // Actually, handling transparency is tricky. 
    // For this demo, let's just assume we compare standard hex.
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

// 6. Event Listeners
canvas.addEventListener('mousedown', (e) => {
    isDrawing = true;
    draw(e); // Draw single dot on click
});
canvas.addEventListener('mousemove', (e) => {
    if (isDrawing && currentTool !== 'bucket') draw(e);
});
canvas.addEventListener('mouseup', () => isDrawing = false);
canvas.addEventListener('mouseleave', () => isDrawing = false);

// 7. Actions
function clearCanvas() {
    ctx.clearRect(0, 0, RES, RES);
}

function downloadArt() {
    // To download a BIG version, we need a temporary canvas
    const link = document.createElement('a');
    
    // We create a temporary canvas 16x larger to export a clear PNG
    const tempCanvas = document.createElement('canvas');
    const tCtx = tempCanvas.getContext('2d');
    tempCanvas.width = 512;
    tempCanvas.height = 512;
    tCtx.imageSmoothingEnabled = false; // Sharp pixels
    tCtx.drawImage(canvas, 0, 0, 512, 512);

    link.download = 'my_pixel_art.png';
    link.href = tempCanvas.toDataURL();
    link.click();
}
