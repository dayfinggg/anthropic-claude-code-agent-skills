# Motion

## Give motion a job

Add motion only when it explains something, such as what changed, where an element came from or went, or that an action registered, and do not let motion be the only carrier of information, because gratuitous animation distracts and can cause physical discomfort.

<example>
A deleted row slides out and the list closes the gap, and a status line also says `Row deleted`.
</example>

Weigh frequency first. Interactions people repeat many times a day need little or no animation, keyboard-initiated actions need none, and rare moments such as onboarding or a first success can afford more, because a delay that is invisible once becomes a tax when repeated.

<example>
A command palette opens instantly, while the first-project success screen may use a `400ms` reveal.
</example>

On Persuade surfaces, use one orchestrated moment such as a single page-load sequence or one reveal, because scattered effects dilute each other, and the same fade-and-slide entrance on every section or a hover animation on every card reads as generated. On Operate surfaces, skip page-load choreography because users arrive to work.

<example>
A launch page staggers its hero lines once on load, while the admin dashboard renders immediately with no entrance.
</example>

## Choose timing and easing

Keep most interface transitions between about `150` and `300ms`. Make small changes faster, let transitions that cross large areas take longer up to about `500ms`, and make exits shorter than entrances, because the user's attention has already moved on.

<example>
A dropdown opens in `180ms` and closes in `120ms`, and a full-screen sheet takes `400ms`.
</example>

Decelerate elements entering the screen, accelerate elements leaving permanently, and use ease-out for responses to user input, because feedback should start immediately. Springs give natural, interruptible motion, and Apple's reduced-motion guidance tightens springs rather than removing feedback. Recent Material releases moved components to spring physics, so check the installed version before choosing easing tokens.

<example>
A drawer enters with `cubic-bezier(0.2, 0, 0, 1)` and leaves with an ease-in curve.
</example>

Make motion interruptible so people never wait for an animation to finish before they can act, because blocked input feels broken. On the web, CSS transitions can retarget mid-flight while keyframe animations cannot.

<example>
Toggling a menu twice quickly reverses the open transition from its current position and does not restart it.
</example>

## Keep it smooth

Animate `transform` and `opacity` where possible, list transitioned properties explicitly instead of `transition: all`, set the transform origin so an element grows from where it was triggered, test on modest hardware, and avoid animating layered shadows and large blurs, because layout properties trigger expensive work and `transition: all` animates properties added later by accident.

<example>
A popover uses `transition: transform 180ms, opacity 180ms` with its origin at the trigger button.
</example>

## Respect motion preferences

Honor reduced-motion settings by replacing movement with a gentler alternative such as a fade and not only deleting the transition, and avoid parallax, zooms, depth changes, and scroll-linked motion for those users, because state changes must stay perceivable and large movement can trigger vestibular symptoms.

<example>
Under `prefers-reduced-motion: reduce`, a slide-in panel becomes a `150ms` fade.
</example>

Give content that moves automatically for more than `5` seconds alongside other content a way to pause, stop, or hide it, flash nothing more than three times per second, and avoid scroll hijacking and autoplaying media with sound, because these remove the user's control and can cause harm.

<example>
A hero carousel gets a visible pause button, and its video stays silent until the user presses play.
</example>
