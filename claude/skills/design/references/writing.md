# Interface writing

## Write for the person using it

Name things by what users understand and not by how the system is built, and choose a voice for the product, then vary tone by situation, plain and direct for errors and payments and warmer for a completed goal, because users think in goals and not in system parts.

<example>
A settings entry reads `Manage notifications` and not `Webhook configuration`.
</example>

Cut every word that does not help, put the most important information first, split a screen that tries to say several things, and read important strings aloud, because people scan and a long string hides its point.

<example>
`Your session expired. Sign in again.` replaces a three-sentence explanation of token lifetimes.
</example>

## Name actions precisely

Start action labels with a verb that says exactly what happens, and keep one name for an action through the whole flow, because consistent vocabulary is how people learn their way around a product.

<example>
`Save changes` replaces `Submit`, and a `Send invoice` button leads to an `Invoice sent` confirmation.
</example>

Pick one capitalization style for each element type and apply it everywhere. Sentence case reads as conversational and is the safer default on the web, the product's existing choice wins when it has one, and a native app follows its platform's capitalization, such as title-style capitalization for button labels on Apple platforms. Use possessive pronouns sparingly and keep one perspective instead of switching between "my" and "your", because mixed styles make one interface sound like several authors.

<example>
Every button of a web product reads `Create new project` in sentence case, and none reads `Create New Project`.
</example>

## Make failure and emptiness useful

Write an error message that says what happened and how to fix it, in plain language, next to the problem. Leave out blame, codes that hide the cause, jokes, and long apologies, because humor wears thin on the third failure and vague errors leave people stuck.

<example>
`Choose a password with at least 8 characters` helps more than `That password is too short`.
</example>

Treat an empty screen as an invitation to act. Explain what will appear and offer the next step directly, because a blank area gives no path forward.

<example>
`No invoices yet. Create your first invoice to track payments.` sits above a `Create invoice` button.
</example>

## Write headlines that say something

State in marketing copy what the product does for whom, specifically enough that it could not describe a competitor. Avoid aspirational filler, superlatives such as "best-in-class" or "cutting-edge", and hedges such as "may help you". If a sentence would fit any product in the category, rewrite it with a concrete fact from the brief, because generic claims carry no information.

<example>
A bookkeeping tool's headline `Match bank transactions to invoices automatically` replaces `Supercharge your finances`.
</example>

Take prices, guarantees, delivery times, customer counts, quotes, and certifications from the user or report them as placeholders to replace, because an invented fact can mislead customers and expose the user.

<example>
A shop page does not claim `Free delivery over 50` unless the user supplied it, and otherwise lists that line as a placeholder.
</example>

## Prepare for localization

When the product has no language yet, write in the language of the user's request, and when the audience's market suggests a different or additional language, follow the request and state the assumption, because a silent language switch changes who the product is for.

<example>
An English request for a Polish bakery's site gets English copy and a note that a Polish version may be wanted.
</example>

Leave room for longer translations, avoid text inside images, and build sentences as whole translatable messages and not by concatenating fragments. Many languages have more plural forms than English, such as Polish with one, few, many, and other, or Arabic with zero, one, two, few, many, and other, so counts need proper plural handling, because word order and plural rules differ between languages.

<example>
A file counter uses one message with `one`, `few`, `many`, and `other` branches, and not `"Deleted " + n + " file(s)"`.
</example>

Format dates, numbers, and currency with locale-aware formatters and not hard-coded patterns, because separators and order differ by locale.

<example>
A price is rendered with `Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' })` and not a template with a fixed `$` prefix.
</example>
