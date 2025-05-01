/* ==========================================================
 * actions.js – Re-usable cut-scene Actions
 * ----------------------------------------------------------
 *  - Every class exposes update() → true when finished.
 *  - Constructor signature is ALWAYS (scene, paramsObject).
 *  - A registry object (Actions) is exported for Cutscene.js.
 * ========================================================== */

/* ---------- Base class ---------- */
class Action {
    /* eslint-disable class-methods-use-this */
    update() { return true; }      // immediately done (override in subclasses)
}

/* ---------- Timing helpers ---------- */
class Wait extends Action {
    constructor(scene, { frames = 1 } = {}) { super(); this.frames = frames; }
    update() { return --this.frames <= 0; }
}

class WaitUntil extends Action {
    constructor(scene, { predicate }) { super(); this.predicate = predicate; }
    update() { return !!this.predicate(); }
}

class WaitForDialogue extends Action {
    constructor(scene) { super(); this.scene = scene; }
    update() { return !this.scene.isTextActive; }
}

/* ---------- Entity motion ---------- */
class MoveAction extends Action {
    constructor(scene, { entity, path = [], ease = 'linear' }) {
        super();
        this.scene  = scene;
        this.target = typeof entity === 'string'
            ? scene.entities.find(e => e.constructor.name === entity)
            : entity;
        this.path  = path;
        this.easeF = MoveAction.EASE[ease] ?? MoveAction.EASE.linear;
        this.t     = 0;
        this.i     = 0;
    }

    static EASE = {
        linear   : p => p,
        easeIn   : p => p * p,
        easeOut  : p => 1 - (1 - p) * (1 - p),
        easeInOut: p => (p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2),
    };

    update() {
        if (!this.target || this.path.length === 0) return true;

        this.t++;
        while (this.i < this.path.length - 1 && this.t >= this.path[this.i + 1].t) {
            this.i++;
        }
        if (this.i >= this.path.length - 1) {
            Object.assign(this.target, this.path[this.path.length - 1]);
            return true;
        }
        const A = this.path[this.i];
        const B = this.path[this.i + 1];
        const p = this.easeF((this.t - A.t) / (B.t - A.t));
        this.target.x = A.x + (B.x - A.x) * p;
        this.target.y = A.y + (B.y - A.y) * p;
        return false;
    }
}

/* ---------- Camera ---------- */
class CameraPanAction extends Action {
    constructor(scene, { x, y, duration = 30, unlockAfter = true } = {}) {
        super();
        this.view   = context.view;           // global camera object from your engine
        this.start  = { x: this.view.x, y: this.view.y };
        this.dest   = { x, y };
        this.frames = duration;
        this.t      = 0;
        this.restoreLock = unlockAfter ? this.view.lockedToPlayer : null;
        this.view.lockedToPlayer = false;
    }

    update() {
        this.t++;
        const p = Math.min(1, this.t / this.frames);
        this.view.x = this.start.x + (this.dest.x - this.start.x) * p;
        this.view.y = this.start.y + (this.dest.y - this.start.y) * p;
        if (p >= 1) {
            if (this.restoreLock !== null) this.view.lockedToPlayer = this.restoreLock;
            return true;
        }
        return false;
    }
}

/* ---------- Screen fades ---------- */
class FadeAction extends Action {
    constructor(scene, { duration = 30, hold = 0 } = {}) {
        super();
        this.remaining = duration + hold;
        scene.startFade(duration, hold);      // helper you already have
    }
    update() { return --this.remaining <= 0; }
}

/* ---------- Dialogue ---------- */
class DialogueAction extends Action {
    constructor(scene, { text }) {
        super();
        this.waiter = new WaitForDialogue(scene);
        scene.startDialogue(text);
    }
    update() { return this.waiter.update(); }
}

/* ---------- Audio ---------- */
class PlaySoundAction extends Action {
    constructor(scene, { name, volume = 1 }) { super(); this.name = name; this.volume = volume; }
    update() { Loader.playSound(this.name, this.volume); return true; }
}

class MusicAction extends Action {
    constructor(scene, { name = null, volume = 0.8, loop = true } = {}) {
        super();
        this.name = name; this.volume = volume; this.loop = loop;
    }
    update() {
        if (this.name) Loader.playMusic(this.name, this.volume, this.loop);
        else Loader.stopMusic();
        return true;
    }
}

/* ---------- Screen shake ---------- */
class ShakeScreenAction extends Action {
    constructor(scene, { amount = 4, frames = 20 } = {}) {
        super(); this.amount = amount; this.frames = frames;
    }
    update() { shakeScreen(this.amount); return --this.frames <= 0; }
}

/* ---------- Entity management ---------- */
class SpawnEntityAction extends Action {
    constructor(scene, { ctor, x, y, args = [] }) {
        super(); this.scene = scene; this.ctor = ctor; this.x = x; this.y = y; this.args = args;
    }
    update() { this.scene.addEntity(new this.ctor(this.x, this.y, ...this.args)); return true; }
}

class RemoveEntityAction extends Action {
    constructor(scene, { entity }) { super(); this.entity = entity; }
    update() { if (this.entity) this.entity.removeFromScene = true; return true; }
}

/* ---------- Generic property tween ---------- */
class SetPropertyAction extends Action {
    constructor(scene, { target, prop, value, duration = 0 }) {
        super();
        this.target = target; this.prop = prop;
        this.start  = target[prop]; this.end = value;
        this.frames = duration; this.t = 0;
    }
    update() {
        if (this.frames === 0) { this.target[this.prop] = this.end; return true; }
        this.t++;
        const p = this.t / this.frames;
        this.target[this.prop] = this.start + (this.end - this.start) * p;
        return this.t >= this.frames;
    }
}

/* ---------- Registry export ---------- */
const Actions = {
    wait          : Wait,
    waitUntil     : WaitUntil,
    waitForDialogue: WaitForDialogue,
    move          : MoveAction,
    camera        : CameraPanAction,
    fade          : FadeAction,
    dialogue      : DialogueAction,
    sound         : PlaySoundAction,
    music         : MusicAction,
    shake         : ShakeScreenAction,
    spawn         : SpawnEntityAction,
    remove        : RemoveEntityAction,
    set           : SetPropertyAction,
};

/* Default export (convenience) */
