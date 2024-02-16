'use strict';

const { WorkloadModuleBase } = require('@hyperledger/caliper-core');

class MyWorkload extends WorkloadModuleBase {
    constructor() {
        super();
    }


    async submitTransaction() {
        const myArgs = {
            contractId: this.roundArguments.contractId,
            contractFunction: 'query',
            invokerIdentity: 'User1',
            contractArguments: 'a',
            // readOnly: true
        };

        await this.sutAdapter.sendRequests(myArgs);
    }

    async cleanupWorkloadModule() {
    }
}

function createWorkloadModule() {
    return new MyWorkload();
}

module.exports.createWorkloadModule = createWorkloadModule;