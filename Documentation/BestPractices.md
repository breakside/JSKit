Beware of modifying references
==============================

- Setters should make protective copies
- Getters do not make copies, so callers should make a copy if they'll be modifying the struct
- Alternative would be to make structs read-only