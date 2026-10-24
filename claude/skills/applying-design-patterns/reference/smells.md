# Smells and over-engineering

## Smell to pattern

| Signal in the code | Pattern | Simplest form |
|---|---|---|
| The same switch on a type code in several places | Strategy | Map from key to function, or one type per variant |
| State checks repeat across methods | State | Enum with one transition table |
| Repeated null checks with the same default | Null Object | One object with the default behavior |
| Type to create depends on input, or construction repeats | Factory | Factory function |
| Many optional constructor parameters | Builder | Named arguments with defaults, or a parameter object |
| A foreign interface does not fit, or its types spread | Adapter | Small wrapper you own with only the operations callers use |
| Optional behavior around an operation in combinations | Decorator | Wrapping function, or the framework's middleware |
| Independent reactions to one event | Observer | List of callbacks, or the framework's events |
| Requests are queued, logged, undone, or replayed | Command | Closure, or a data record with a handler when stored |
| Algorithms differ in one or two fixed steps | Template Method | Function taking the varying step as a parameter |
| Callers repeat one call sequence into a subsystem | Facade | One function for the common path |
| A tree of parts and wholes treated alike | Composite | Recursive data with one recursive function |

Use no pattern when variants differ only by a value, which belongs in a parameter or table. Use none for one short conditional in one place.

## Over-engineering

In a review, flag these and remove them with the refactorings in the catalog.

- An interface with one implementation and no boundary or test need
- A factory that only calls a constructor
- A class that only forwards calls
- Subclasses that barely differ
- A command executed where it is created
- A global behind a static accessor
