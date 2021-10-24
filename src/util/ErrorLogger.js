/*
    A class dedicated to the code assignment and handling of errors.
    All error codes are base64 of raw bytes which follow the following pattern
    SHORTYEAR MONTH DAY HOUR MINUTE SECOND RAND RAND RAND RAND RAND
*/
const { MessageEmbed, MessageActionRow, MessageButton } = require("discord.js");

class ErrorLogger {
    constructor(Client) {
        this._Client = Client;
    }

    _genErrorCode() {
        let dateNow = new Date(Date.now());
        let shortYear = parseInt(dateNow.getUTCFullYear().toString().split("").splice(2, 2).join(""));
        let month = dateNow.getUTCMonth();
        let day = dateNow.getUTCDate();
        let hour = dateNow.getUTCHours();
        let minute = dateNow.getUTCMinutes();
        let second = dateNow.getUTCSeconds();

        let randomNumbers = [
            Math.floor(Math.random() * 64),
            Math.floor(Math.random() * 64),
            Math.floor(Math.random() * 64),
            Math.floor(Math.random() * 64),
            Math.floor(Math.random() * 64)
        ];

        let errorCodeBuffer = Buffer.from([shortYear, month, day, hour, minute, second, randomNumbers[0], randomNumbers[1], randomNumbers[2], randomNumbers[3], randomNumbers[4]]);

        return errorCodeBuffer.toString("base64");
    }

    _genDevEmbed(ecode, type, code, message, stack) {
        // Generates the embed sent to the bot developers. Contains detailed error information
        let embed = new MessageEmbed()
            .setColor("#ff4f4f")
            .setTitle(this._Client.LanguageHandler.get("core/errorhandle/devembed/title"))
            .setDescription(this._Client.LanguageHandler.get("core/errorhandle/devembed/desc"))
            .addFields(
                { name: this._Client.LanguageHandler.get("core/errorhandle/devembed/fieldnames/type"), value: type, inline: true },
                { name: this._Client.LanguageHandler.get("core/errorhandle/devembed/fieldnames/code"), value: code, inline: true },
                { name: this._Client.LanguageHandler.get("core/errorhandle/devembed/fieldnames/message"), value: message, inline: true }
            )
            .setTimestamp(Date.now())
            .setFooter(ecode);

        if (type == "Node.js") embed.addField(this._Client.LanguageHandler.get("core/errorhandle/devembed/fieldnames/stack"), stack, false);
        if (type == "Discord API") embed.addField(this._Client.LanguageHandler.get("core/errohandle/devembed/fieldnames/path"), stack, false);

        return embed;
    }

    _genUserEmbed(errorCode) {
        let embed = new MessageEmbed()
            .setColor("#fff266")
            .setTitle(this._Client.LanguageHandler.get("core/errorhandle/userembed/title"))
            .setDescription(this._Client.LanguageHandler.get("core/errorhandle/userembed/desc").format(errorCode));

        return embed;
    }

    _genUserComponent() {
        let components = new MessageActionRow()
            .addComponents(
                new MessageButton()
                    .setLable(this._Client.LanguageHandler.get("core/errorhandle/userembed/components/joinDiscord"))
                    .setStyle("LINK")
                    .setURL("https://discord.gg/coneyponey")
            );

        return components;
    }

    async reportError(interaction, error) {
        if (error.stack == undefined) {
            // DiscordAPI error.
            let errorCode = this._genErrorCode();

            let devEmbed = this._genDevEmbed(errorCode, "Discord API", error.code, error.message, error.method + ": " + error.path);
            let userEmbed = this._genUserEmbed(errorCode);
            let userComponents = this._genUserComponent();

            let devGuild = await this._Client.guilds.fetch(this._Client.config.devGuild);
            let logChannel = await devGuild.channels.fetch(this._Client.config.errorLogChannel);

            await logChannel.send({ embeds: [devEmbed] });

            if (interaction.replied) return interaction.editReply({ embeds: [userEmbed], components: [userComponents] });
            if (interaction.deferred) return interaction.followUp({ embeds: [userEmbed], components: [userComponents] });
            return interaction.reply({ embeds: [userEmbed], components: [userComponents] });
        }
    }
}