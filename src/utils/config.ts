
export interface BoteConfig {
    /**
     * Credentials. DO NOT SHARE THE CONTENT TO OTHERS!
     */
    credentials: Credentials

    /**
     * Everything about files.
     */
    storage?: StorageSettings

    telegram?: OtherTelegramSettings

    devMode: boolean

    /**
     * Max length of module name in logging.
     */
    loggingModuleLength?: number
}

export interface StorageSettings {
    /**
     * Log file. Default goes 'latest.log'.
     */
    programLog?: string,

    /**
     * A folder containing all of your plugins.
     */
    plugins: string
}

export interface Credentials {
    /**
     * Should be a valid mongodb connection string
     */
    mongodbConnectionURL: string

    /**
     * Telegram bot token. Obtain the token from `@botfather`.
     */
    telegramBoteToken: string
}

export interface OtherTelegramSettings {
    /**
     * Set a valid webhook settings to enable webhook mode.
     * 
     * This is highly recommended in production environment!
     */
    useWebhook?: WebhookConfig
    
    /**
     * Set a valid api url to enable custom telegram bot API
     */
    telegramAPI?: string
}

export interface WebhookConfig {
    domain: string

    /**
     * For privacy and security issues that the TLS is required if you are going to run bote on webhook mode.
     * This is highly recommended in production environment.
     * 
     * If you are testing your project, please just use long polling mode.
     */
    tls: WebhookTLS

    /**
     * Please use random password generate with following options to generate this field.
     * This is required for privacy and security issues. 
     * 
     * You don't wanna some hackers send illegal request to your server right?
     * Then do it!
     * 
     * Length: 50-100
     * Caracters: A-Z a-z 0-9
     */
    secretToken: string

    path?: string
    host?: string
    port?: number
}

export interface WebhookTLS {
    /**
     * Path to your certificate key file
     * Please checkout the following link if you'd like to use a self-signed certificate
     * 
     * https://core.telegram.org/bots/self-signed
     */
    public: string

    /**
     * Path to your private key file
     * Please checkout the following link if you'd like to use a self-signed certificate
     * 
     * https://core.telegram.org/bots/self-signed
     */
    private: string
}


export function defineConfig(config: BoteConfig) {
    return config
}