module.exports = {
    url: 'amqp://localhost',
    exchangeLogs: 'logs',
    exchangeInfo: 'info',
    techWorkTimeIn_ms: 3000,
    generateUuid: function generateUuid() {
        return Math.random().toString() +
            Math.random().toString() +
            Math.random().toString();
    }
};