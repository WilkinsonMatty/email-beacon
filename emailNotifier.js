winston = require('winston')

module.exports = class EmailNotifier{

    notify(emailAddress, message){
        winston.info(`_________________________________________________________________`)
        winston.info(`sending email to ${emailAddress}`)
        winston.info(`Message: ${message}`)
        winston.info(`_________________________________________________________________`)
    }
}