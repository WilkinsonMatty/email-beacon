

module.exports = class EmailNotifier{

    notify(emailAddress, message){
        console.log(`sending email to ${emailAddress}`,`Message: ${message}`)
    }
}