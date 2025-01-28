import controller from "./controller.js";

const run = async () => {
    await controller.init();
    try {
        await controller.push({ username: "rafa", password: "teste" });
    } catch (error) {
        console.log("push problem");
        console.log(error);
    }

    try {
        await controller.has("rafa");
    } catch (error) {
        console.log("has problem");
        console.log(error);
    }

    try {
        const user = await controller.get("rafa");
    } catch (error) {
        console.log("get problem");
        console.log(error);
    }

    try {
        await controller.getUserSessions("rafa");
    } catch (error) {
        console.log("getUserSessions problem");
        console.log(error);
    }


    try {
        await controller.delete("rafa");
    } catch (error) {
        console.log("delete problem");
        console.log(error);
    }

}

run();