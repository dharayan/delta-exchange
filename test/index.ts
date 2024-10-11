import {DeltaExchangeClient, Resolution} from "../lib";
import dotenv from "dotenv"

dotenv.config()

const deltaExchangeClient = new DeltaExchangeClient("a", "b")

const main = async () => {
    const data = await deltaExchangeClient.getOHLC("BTCUSDT", Resolution._3m, Date.now() - 1000 * 60 * 60, Date.now())
    if (data?.length < 10) {
        throw new Error("invalid data received")
    }
}

main().then(() => console.log("test successfully completed"))
