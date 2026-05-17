const { z } = require("zod");
const s = z.object({ matcha_powder_id: z.string().uuid().optional().nullable() });
console.log("With undefined:", s.safeParse({ matcha_powder_id: undefined }).success);
console.log("With null:", s.safeParse({ matcha_powder_id: null }).success);
console.log("With string 'undefined':", s.safeParse({ matcha_powder_id: "undefined" }).success);
