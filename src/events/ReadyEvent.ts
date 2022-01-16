/*
 * Copyright © 2022 Ben Petrillo. All rights reserved.
 *
 * Project licensed under the MIT License: https://www.mit.edu/~amini/LICENSE.md
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
 * OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
 * HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
 * WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE
 * OR OTHER DEALINGS IN THE SOFTWARE.
 *
 * All portions of this software are available for public use, provided that
 * credit is given to the original author(s).
 */

import {IEvent} from "../structs/IEvent";
import {Client, ClientEvents, Presence} from "discord.js";
import Logger from "../utils/Logger";
import SlashCommandUtil from "../utils/SlashCommandUtil";
import Config from "../utils/Config";
import DeployManager from "../managers/DeployManager";
import CommandManager from "../managers/CommandManager";
import {client} from "../PrideBot";

export default class ReadyEvent implements IEvent {

    public name: keyof ClientEvents;
    public once: boolean;
    public readonly client: Client;

    constructor(client: Client, name: keyof ClientEvents, once: boolean) {
        this.name = name;
        this.once = once;
        this.client = client;
    }

    public async execute(): Promise<void> {
        this.handlePresence();
        Logger.clear();
        Logger.info(`Logged in as ${this.client.user.tag}.`);
        await new CommandManager(this.client);
        await this.handleApplicationCommands();
    }

    private handlePresence(): void {
        this.updatePresence()
            .then(() => setInterval(() => this.updatePresence(), 500 * 1000))
            .catch(() => this.handlePresence())
        return undefined;
    }

    private async updatePresence(): Promise<Presence | undefined> {
        const activity = Config.get("ACTIVITY");
        return this.client.user.setActivity({type: "WATCHING", name: activity});
    }

    private async handleApplicationCommands() {
        if (JSON.parse(Config.get("DEPLOY-APPLICATION-COMMANDS-GUILD")) == true) {
            await new DeployManager(this.client, SlashCommandUtil.getAllSlashCommandCommandData(this.client), {
                deploy: true,
                delete: false,
                guild: true
            });
        } else if (JSON.parse(Config.get("DEPLOY-APPLICATION-COMMANDS-GLOBAL")) == true) {
            await new DeployManager(this.client, SlashCommandUtil.getAllSlashCommandCommandData(this.client), {
                deploy: true,
                delete: false,
                guild: false
            });
        } else if (JSON.parse(Config.get("DELETE-APPLICATION-COMMANDS-GUILD")) == true) {
            await new DeployManager(this.client, SlashCommandUtil.getAllSlashCommandCommandData(this.client), {
                deploy: false,
                delete: true,
                guild: true
            });
        } else if (JSON.parse(Config.get("DELETE-APPLICATION-COMMANDS-GLOBAL")) == true) {
            await new DeployManager(this.client, SlashCommandUtil.getAllSlashCommandCommandData(this.client), {
                deploy: false,
                delete: true,
                guild: false
            });
        } else {
            Logger.info("Application commands loaded.");
        }
    }
}