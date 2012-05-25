# Todo

- hooks (see below)
- fix integration tests not finishing properly
- MockStore for tests

## Future api

Serialise hooks ..?

    var lian = require('lian');

    function Person (name) {
        lian(
            this,
            'person',
            {
                'serialise': function (done) {
                    this.dob = this.dob.toString();
                    done.resolve();
                },
                'deserialise': function (done) {
                    this.dob = new Date(this.dob);
                    done.resolve();
                }
            }
        );
        this.name = name;
    }
