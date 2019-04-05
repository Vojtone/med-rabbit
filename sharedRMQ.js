module.exports = {
    publishRMQ: function (channel, exchangeName, msg) {
        channel.assertExchange(exchangeName, 'fanout', {durable: false});
        channel.publish(exchangeName, '', new Buffer(msg));
    },
    subscribeRMQ: function (channel, exchangeName) {
        channel.assertExchange(exchangeName, 'fanout', {durable: false});
        channel.assertQueue('', {exclusive: true}, function(err, q) {
            console.log("[*] Waiting for %s in %s. To exit press CTRL+C", exchangeName, q.queue);
            channel.bindQueue(q.queue, exchangeName, '');

            channel.consume(q.queue, function(msg) {
                if(msg.content)
                    console.log("[.] %s: %s", exchangeName, msg.content.toString());
            }, {noAck: true});
        });
    }
};