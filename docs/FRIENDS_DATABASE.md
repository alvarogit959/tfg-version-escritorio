# Campos en MongoDB para amigos y chat privado

## Colección `users` (añadir a documentos existentes)

```js
{
  friends: []  // Array de ObjectId → referencia a otros usuarios (amigos aceptados)
}
```

**Ejemplo** (tu usuario admin tras aceptar amigos):

```js
friends: [
  ObjectId("6a0d2733b8693906c19b10f8"),
  ObjectId("6a0d2733b8693906c19b1136")
]
```

En MongoDB Compass puedes añadir el campo manualmente:

```js
{ $set: { friends: [] } }
```

a todos los usuarios que no lo tengan. El servidor ya crea `friends: []` en usuarios nuevos.

---

## Colección nueva: `friendrequests`

Cada solicitud de amistad es un documento:

| Campo        | Tipo     | Descripción                                      |
|-------------|----------|--------------------------------------------------|
| `_id`       | ObjectId | ID automático                                    |
| `from`      | ObjectId | Usuario que envía la solicitud → ref `users`     |
| `to`        | ObjectId | Usuario que recibe la solicitud → ref `users`    |
| `status`    | String   | `"pending"` \| `"accepted"` \| `"declined"`      |
| `createdAt` | Date     | Fecha de envío                                   |
| `respondedAt` | Date   | Fecha de aceptar/rechazar (null si pendiente)    |

**Índice recomendado** (único por par emisor→receptor):

```js
db.friendrequests.createIndex({ from: 1, to: 1 }, { unique: true })
```

**Ejemplo pendiente:**

```js
{
  from: ObjectId("6a09779795237b782890f9a0"),
  to: ObjectId("6a0d2733b8693906c19b10f8"),
  status: "pending",
  createdAt: ISODate("2026-05-21T16:00:00Z"),
  respondedAt: null
}
```

---

## Colección `conversations` (ya existe — usar `type: "private"`)

Para chat entre dos amigos:

| Campo           | Tipo       | Descripción                                    |
|----------------|------------|------------------------------------------------|
| `type`         | String     | `"private"` (1 a 1) o `"group"` (chat grupal)  |
| `participants` | ObjectId[] | Exactamente 2 IDs en chats privados            |
| `lastMessage`  | Object     | `{ text, sender, sentAt }` — último mensaje    |
| `createdAt`    | Date       | Creación de la conversación                      |

**Ejemplo chat privado:**

```js
{
  type: "private",
  participants: [
    ObjectId("6a09779795237b782890f9a0"),
    ObjectId("6a0d2733b8693906c19b10f8")
  ],
  lastMessage: {
    text: "Hola",
    sender: ObjectId("6a09779795237b782890f9a0"),
    sentAt: ISODate("2026-05-21T16:05:00Z")
  },
  createdAt: ISODate("2026-05-21T16:00:00Z")
}
```

No hace falta crear campos nuevos en `conversations` si ya tienes `type` y `participants`.

---

## Colección `messages` (sin cambios)

Sigue igual; el chat privado se distingue por `conversationId` apuntando a una conversación `type: "private"`:

```js
{
  conversationId: ObjectId("..."),  // conversación private
  senderId: ObjectId("..."),
  text: "Hola",
  type: "text",
  readBy: [ ObjectId("...") ],
  sentAt: ISODate("..."),
  edited: false,
  deleted: false
}
```

---

## Flujo resumido

1. Usuario A envía solicitud → documento en `friendrequests` con `status: "pending"`.
2. Usuario B acepta → `status: "accepted"`, A y B se añaden a `friends` mutuamente, se crea (si no existe) una `conversation` con `type: "private"`.
3. Los mensajes privados usan ese `conversationId` en `messages`.
4. El chat grupal sigue usando la conversación con `type: "group"` (la que ya tienes).
