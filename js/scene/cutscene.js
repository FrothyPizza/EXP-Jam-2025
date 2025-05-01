/* ==========================================================
 * cutscene.js – Plays a JSON cut-scene script
 * ----------------------------------------------------------
 * Relies on:
 *   • Clock  – your existing frame-counter helper
 *   • Actions – the registry exported by actions.js
 * ========================================================== */


class Cutscene extends Scene {
    /**
     * @param {Array<Object|Object[]>} script – array of steps or batches
     * @param {LevelScene}             level  – the underlying gameplay scene
     */
    constructor(script, level) {
        super();
        this.script        = script;
        this.scene         = level;
        this.stepIndex     = -1;         // will ++ before reading
        this.stepClock     = new Clock();
        this.activeActions = [];
        this.overlays      = [];
        this.finished      = false;

        this.executeNextStep();          // start immediately
    }

    /* ---------------- main loop hooks ---------------- */
    update() {
        if (this.finished) return;

        /* 1 — advance all running actions */
        this.activeActions = this.activeActions
            .filter(action => !action.update());

        /* 2 — if none left, maybe queue the next step */
        if (this.activeActions.length === 0) {
            const next = this.script[this.stepIndex + 1];
            if (next && this.stepClock.getTime() < (next.wait || 0)) return;
            this.executeNextStep();
        }
    }

    draw(ctx) {
        this.scene.draw(ctx);            // let gameplay scene render first
        this.overlays.forEach(o => o.draw(ctx));
    }

    /* ---------------- internal helpers ---------------- */
    executeNextStep() {
        this.stepIndex++;

        /* End of script → restore control to gameplay */
        if (this.stepIndex >= this.script.length) {
            this.finished       = true;
            this.scene.cutscene = null;
            return;
        }

        const rawStep = this.script[this.stepIndex];
        this.stepClock.restart();

        /* Allow either a single step object or an array (parallel batch) */
        const batch = Array.isArray(rawStep) ? rawStep : [rawStep];

        batch.forEach(step => {
            const { action, wait: _ignore, ...params } = step;
            const ActionCls = Actions[action];
            if (!ActionCls) {
                console.warn(`Cutscene: unknown action '${action}'.`);
                return;
            }
            this.activeActions.push(new ActionCls(this.scene, params));
        });
    }
}

/* If you prefer global access instead of ES-modules: */
// window.Cutscene = Cutscene;

