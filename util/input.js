let Inputs = {};
let KeyboardInputs = {};
let GamepadInputs = {};

// Initialize Inputs and GamepadInputs for each control
function createInput(name, keys) {
    KeyboardInputs[name] = false;
    GamepadInputs[name] = false;
    Inputs[name] = false;
    document.addEventListener('keydown', function(e) {
        if (keys.includes(e.key)) {
            KeyboardInputs[name] = true;
        }
    });
    document.addEventListener('keyup', function(e) {
        if (keys.includes(e.key)) {
            KeyboardInputs[name] = false;
        }
    });
}

createInput('left', ['ArrowLeft']);
createInput('right', ['ArrowRight']);
createInput('jump', ['ArrowUp', 'z', 'Z', ' ']);
createInput('down', ['ArrowDown']);
createInput('shoot', ['x', 'X']);
createInput('dash', ['Shift', 'c', 'C']);
createInput('up', ['ArrowUp']);
createInput('enter', ['Enter']);
createInput('escape', ['Escape', 'Delete', 'Backspace']);
createInput('pause', ['Escape', 'p', 'P']);


// Gamepad support
window.addEventListener('gamepadconnected', function(e) {
    console.log('Gamepad connected:', e.gamepad);
});

window.addEventListener('gamepaddisconnected', function(e) {
    console.log('Gamepad disconnected:', e.gamepad);
});

function updateGamepadInputs() {
    const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];

    // Reset GamepadInputs
    for (let name in GamepadInputs) {
        GamepadInputs[name] = false;
    }

    let axisThreshold = 0.25;

    for (let i = 0; i < gamepads.length; i++) {
        const gp = gamepads[i];
        if (gp) {
            const buttons = gp.buttons;
            const axes = gp.axes;

            // Map gamepad inputs to controls
            if (buttons[14].pressed || axes[0] < -axisThreshold) {
                GamepadInputs['left'] = true; // D-pad Left or Left Stick Left
            }
            if (buttons[15].pressed || axes[0] > axisThreshold) {
                GamepadInputs['right'] = true; // D-pad Right or Left Stick Right
            }
            if (buttons[13].pressed || axes[1] > axisThreshold) {
                GamepadInputs['down'] = true; // D-pad Down or Left Stick Down
            }
            if (buttons[0].pressed) {
                GamepadInputs['jump'] = true; // A button
            }
            if (buttons[2].pressed) {
                GamepadInputs['shoot'] = true; // X button
            }
            // y and L are dash
            if (buttons[3].pressed || buttons[4].pressed) {
                GamepadInputs['dash'] = true; // Y or L button
            }
            // a, b, and R are enter
            if (buttons[1].pressed || buttons[5].pressed || buttons[6].pressed) {
                GamepadInputs['enter'] = true; // B, R, or A button
            }
            if (buttons[7].pressed || buttons[8].pressed) {
                GamepadInputs['pause'] = true; // Start or Select button
            }

            // up is up
            if (buttons[12].pressed || axes[1] < -axisThreshold) {
                GamepadInputs['up'] = true; // D-pad Up or Left Stick Up
            }
            

        }
    }

    // Combine KeyboardInputs and GamepadInputs into Inputs
    for (let name in Inputs) {
        Inputs[name] = KeyboardInputs[name] || GamepadInputs[name];
    }

    // log the axis values
    if (gamepads[0] && gamepads[0].axes)
    console.log(gamepads[0].axes);

    requestAnimationFrame(updateGamepadInputs);
}

// Start the gamepad input update loop
updateGamepadInputs();

// Existing keys array (if needed elsewhere in your code)
let keys = [];
document.addEventListener('keydown', (e) => {
    keys[e.key] = true;
});
document.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});
