const { CommandStructures, SwitchbladeEmbed } = require('../../')
const { Command, CommandParameters, CommandRequirements, StringParameter } = CommandStructures

const i18next = require('i18next')

const languageCodes = () => Object.keys(i18next.store.data)
const languageAliases = (cli) => Object.values(cli.cldr.languages).map(v => Object.values(v)).reduce((a, v) => a.concat(v), []).reduce((a, v) => a.concat(v), [])

module.exports = class Config extends Command {
  constructor (client) {
    super(client)
    this.name = 'config'
    this.aliases = ['cfg']
    this.subcommands = [new ConfigLanguage(client, this), new ConfigPrefix(client, this)]

    this.requirements = new CommandRequirements(this, {guildOnly: true, databaseOnly: true, permissions: ['MANAGE_GUILD']})
  }

  run ({ t, author, prefix, alias, channel, guildDocument }) {
    const embed = new SwitchbladeEmbed(author)
    embed.setDescription([
      t('commands:config.guildLang', { command: `${prefix}${alias || this.name}` }),
      t('commands:config.guildPrefix', { command: `${prefix}${alias || this.name}` })
    ].join('\n'))
    channel.send(embed)
  }
}

class ConfigLanguage extends Command {
  constructor (client, parentCommand) {
    super(client, parentCommand)
    this.name = 'language'
    this.aliases = ['lang']

    this.parameters = new CommandParameters(this,
      new StringParameter({
        full: true,
        whitelist: () => languageCodes().concat(languageAliases(this.client)),
        missingError: ({ t, prefix }) => {
          return {
            title: t('commands:config.subcommands.language.noCode'),
            description: [
              `**${t('commons:usage')}:** \`${prefix}${parentCommand.name} ${this.name} ${t('commands:config.subcommands.language.commandUsage')}\``,
              '',
              `__**${t('commands:config.subcommands.language.availableLanguages')}:**__`,
              `**${languageCodes().map(l => `\`${l}\``).join(', ')}**`
            ].join('\n')
          }
        }})
    )
  }

  async run ({ t, author, channel, guild }, lang) {
    const langCodes = languageCodes()
    const langDisplayNames = this.client.cldr.languages
    if (!langCodes.includes(lang)) {
      lang = langCodes.find(lc => langDisplayNames[lc] && Object.values(langDisplayNames[lc]).reduce((a, v) => a.concat(v), []).includes(lang.toLowerCase()))
    }

    const language = langDisplayNames[lang] && langDisplayNames[lang][lang]
    const langDisplayName = language && language[0]

    const embed = new SwitchbladeEmbed(author)
    await this.client.modules.guildConfig.setLanguage(guild, lang)
    embed.setTitle(i18next.getFixedT(lang)('commands:config.subcommands.language.changedSuccessfully', { lang: langDisplayName || lang }))
    channel.send(embed)
  }
}

class ConfigPrefix extends Command {
  constructor (client, parentCommand) {
    super(client, parentCommand)
    this.name = 'prefix'

    this.parameters = new CommandParameters(this,
      new StringParameter({ full: true, required: false, missingError: 'commands:config.subcommands.prefix.noPrefix' })
    )
  }

  async run ({ t, author, channel, guild }, prefix) {
    const embed = new SwitchbladeEmbed(author)
    prefix = prefix || process.env.PREFIX
    await this.client.modules.guildConfig.setPrefix(guild, prefix)
    embed.setTitle(t('commands:config.subcommands.prefix.changedSuccessfully', {prefix}))
    channel.send(embed)
  }
}
