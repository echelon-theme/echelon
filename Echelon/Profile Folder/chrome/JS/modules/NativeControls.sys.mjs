export class NativeControls
{
    controls = [
        "checkbox",
        "menulist"
    ];

    root = null;
    MutationObserver = null;
    observer = null;

    /* MutationObserver just doesn't exist in this context. Fun! */
    constructor(root, MutationObserver)
    {
        this.MutationObserver = MutationObserver;
        this.root = root;
        this.observe();
    }

    get selector()
    {
        return `:is(${this.controls.join(", ")}):not([native])`;
    }

    onMutation()
    {
        for (const control of this.root.querySelectorAll(this.selector))
        {
            control.setAttribute("native", "");
        }
    }

    observe()
    {
        this.observer = new this.MutationObserver(this.onMutation.bind(this));
        this.observer.observe(this.root, {
            childList: true,
            subtree: true
        });
    }
}