import { DiscordSDK } from "@discord/embedded-app-sdk";

/**
 * This function should be called from the top-level of your embedded app
 * It initializes the SDK, then authorizes, and authenticates the embedded app
 */
export async function initializeSdk(): Promise<DiscordSDK> {
  if (typeof process.env.REACT_APP_CLIENT_ID !== "string") {
    throw new Error("Must specify 'REACT_APP_CLIENT_ID");
  }

  const discordSdk = new DiscordSDK(process.env.REACT_APP_CLIENT_ID);
  await discordSdk.ready();

  // Pop open the OAuth permission modal and request for access to scopes listed in scope array below
  const { code } = await discordSdk.commands.authorize({
    client_id: process.env.REACT_APP_CLIENT_ID,
    response_type: "code",
    state: "",
    prompt: "none",
    scope: ["identify", "guilds", "rpc.activities.write", "rpc.voice.read"],
  });

  // Retrieve an access_token from your embedded app's server
  const { access_token } = await fetch(
    "https://brawlerbearz.club/api/discord",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        code,
      }),
    }
  ).then((res) => res.json());

  // Authenticate with Discord client (using the access_token)
  await discordSdk.commands.authenticate({
    access_token,
  });

  return discordSdk;
}
