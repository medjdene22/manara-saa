const AWS = require("aws-sdk");
const ddb = new AWS.DynamoDB.DocumentClient();
const TABLE = process.env.TABLE_NAME;

const json = (statusCode, body) => ({
  statusCode,
  headers: {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
  },
  body: JSON.stringify(body),
});

exports.handler = async (event) => {
  try {
    const method = event.requestContext?.http?.method || event.httpMethod;

    const rawPath = event.rawPath || event.path || "/";
    const pathParts = rawPath.split("/").filter(Boolean);

    let body = null;
    if (event.body) {
      try {
        body = JSON.parse(event.body);
      } catch {
        body = event.body; // fallback if not JSON
      }
    }

    // Route must start with "items"
    if (pathParts[0] !== "items") {
      return json(404, { message: "Not Found" });
    }

    const id = pathParts[1];

    // GET /items → list all
    if (method === "GET" && !id) {
      const res = await ddb.scan({ TableName: TABLE }).promise();
      return json(200, res.Items || []);
    }

    // GET /items/{id} → get by id
    if (method === "GET" && id) {
      const res = await ddb
        .get({
          TableName: TABLE,
          Key: { id },
        })
        .promise();

      if (!res.Item) return json(404, { message: "Item not found" });
      return json(200, res.Item);
    }

    // POST /items → create new
    if (method === "POST") {
      if (!body || !body.id) {
        return json(400, { message: "Missing id in body" });
      }
      await ddb.put({ TableName: TABLE, Item: body }).promise();
      return json(201, body);
    }

    // PUT/PATCH /items/{id} → update
    if ((method === "PUT" || method === "PATCH") && id) {
      if (!body) return json(400, { message: "Missing body" });

      const existing = await ddb
        .get({
          TableName: TABLE,
          Key: { id },
        })
        .promise();

      if (!existing.Item) return json(404, { message: "Item not found" });

      const updated = { ...existing.Item, ...body, id };
      await ddb.put({ TableName: TABLE, Item: updated }).promise();
      return json(200, updated);
    }

    // DELETE /items/{id} → delete
    if (method === "DELETE" && id) {
      await ddb
        .delete({
          TableName: TABLE,
          Key: { id },
        })
        .promise();

      return json(204, {}); // 204 = No Content
    }

    return json(405, { message: "Method Not Allowed" });
  } catch (err) {
    console.error("Error:", err);
    return json(500, {
      message: "Internal Server Error",
      error: err.message,
    });
  }
};
