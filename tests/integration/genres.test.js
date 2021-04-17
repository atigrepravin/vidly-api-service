const request = require("supertest");
const mongoose = require("mongoose");
const { Genre } = require("../../models/genres");
const { User } = require("../../models/users");
let server;
describe("/api/genres", () => {
  beforeEach(() => {
    server = require("../../index");
  });
  afterEach(async () => {
    await Genre.deleteMany({});
    server.close();
  });

  describe("GET /", () => {
    it("should return all the genres", async () => {
      await Genre.collection.insertMany([
        { name: "genre1" },
        { name: "genre2" },
      ]);
      const res = await request(server).get("/api/genres");
      expect(res.status).toBe(200);
      expect(res.body.length).toBe(2);
      expect(res.body.some((g) => g.name === "genre1")).toBeTruthy();
      expect(res.body.some((g) => g.name === "genre2")).toBeTruthy();
    });
  });

  describe("GET /:id", () => {
    it("should return 404 if invalid id is passed", async () => {
      const res = await request(server).get("/api/genres/1");
      expect(res.status).toBe(404);
    });

    it("should return 404 if genre is not exist", async () => {
      const id = mongoose.Types.ObjectId();
      const res = await request(server).get(`/api/genres/${id}`);
      expect(res.status).toBe(404);
    });

    it("should return a genre if valid id is passed", async () => {
      let genre = new Genre({ name: "genre1" });
      await genre.save();
      const res = await request(server).get(`/api/genres/${genre._id}`);
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("name", genre.name);
    });
  });

  describe("POST /", () => {
    let token;
    let name;
    const exec = () => {
      return request(server)
        .post("/api/genres")
        .send({ name })
        .set("x-auth-token", token);
    };

    beforeEach(() => {
      token = new User().generateAuthToken();
      name = "genre1";
    });

    it("should return 401 if client is not logged in", async () => {
      token = "";
      const res = await exec();
      expect(res.status).toBe(401);
    });

    it("should return 400 if genre is less than 5 characters", async () => {
      name = "1234";
      const res = await exec();
      expect(res.status).toBe(400);
    });

    it("should return 400 if genre is more than 50 characters", async () => {
      name = new Array(52).join("a");
      const res = await exec();

      expect(res.status).toBe(400);
    });

    it("should save the genre if it is valid", async () => {
      await exec();
      const genre = await Genre.find({ name: "genre1" });
      expect(genre).not.toBe(null);
    });

    it("should return genre if it is valid", async () => {
      const res = await exec();
      expect(res.body).toHaveProperty("_id");
      expect(res.body).toHaveProperty("name");
    });
  });

  describe("DELETE /:id", () => {
    it("should return 403 if user is not an admin", async () => {
      const genre = new Genre({ name: "genre1" });
      await genre.save();
      const token = new User().generateAuthToken();
      const res = await request(server)
        .delete("/api/genres/" + genre._id)
        .set("x-auth-token", token);
      expect(res.status).toBe(403);
    });

    it("should return 404 if genre is not exist", async () => {
      const genre = new Genre({ name: "genre1" });
      const user = new User({ isAdmin: true });
      const token = user.generateAuthToken();

      const res = await request(server)
        .delete("/api/genres/" + genre._id)
        .set("x-auth-token", token);

      expect(res.status).toBe(404);
    });

    it("should return 200 if genre is removed", async () => {
      const genre = new Genre({ name: "genre1" });
      await genre.save();
      const user = new User({ isAdmin: true });
      const token = user.generateAuthToken();

      const res = await request(server)
        .delete("/api/genres/" + genre._id)
        .set("x-auth-token", token);

      const result = Genre.findById(genre._id);
      expect(res.status).toBe(200);
    });
  });
});
