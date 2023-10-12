import { Router } from 'express';
import * as solc from 'solc';
import * as Web3 from 'web3';

import { serviceStore } from './models.store';
import { OracleInfo } from "./definitions";
import { ParameterInfo } from "./definitions";
import { parseOracle } from "./models.parsers";
import { Register_Function } from './registeContract_to_bitxhub';


const models: Router = Router();
// var web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
var web3 = new Web3(new Web3.providers.HttpProvider("http://43.142.87.250:8545"));
//var web3 = new Web3(new Web3.providers.HttpProvider("http://193.40.11.64:80"));

var assessLoanRiskAddress = '';
var appraisePropertyAddress = '';
var oracleContractData;


function toChecksumAddress(address) {
    address = address.toLowerCase().replace('0x', '');
    let hash = web3.sha3(address).replace('0x', '');
    let checksumAddress = '0x';
  
    for (let i = 0; i < address.length; i++) {
      if (parseInt(hash[i], 16) >= 8) {
        checksumAddress += address[i].toUpperCase();
      } else {
        checksumAddress += address[i];
      }
    }
  
    return checksumAddress;
}

web3.eth.filter("latest", function(error, result) {
  if (!error) {
      var info = web3.eth.getBlock(result);
      if(info.transactions && info.transactions.length > 0) {
          info.transactions.forEach(transactionHash => {                                 
              var transRec = web3.eth.getTransactionReceipt(transactionHash);
              transRec.logs.forEach(logElem => {
                  serviceStore.forEach(serviceInfo => { 
                      if(serviceInfo.address === logElem.address.toString()) {
                        var index = parseInt(logElem.data.toString(), 16);
                        var contractInterface = web3.eth.contract(serviceInfo.contract[serviceInfo.entryContractName][serviceInfo.solname].abi);

                        //console.log("Contract Interface ", contractInterface);                        
                        var contractInstance = contractInterface.at(logElem.address);
                        //getDataFunction方法获取DataFunction的值，用于判断，是跨链任务，还是同态加密，或者其他
                        contractInstance.getDataFunction.call("DataFunction", (err, result) => {
                            if (!err) {
                               
                                    console.log(result);                                 
                                    contractInstance.getDataVariableFile.call("Risc0FileName", (err, result) => {
                                        if(!err){ console.log(result); risc0FileName = result; executeRISC0_Function();}
                                        else console.log('Error:',err);
                                    });
                                    contractInstance.getDataVariableParam1.call("Risc0ParamName1", (err, result) => {
                                        if(!err){ console.log(result); risc0ParamName1 = result; executeRISC0_Function();}
                                        else console.log('Error:',err);
                                    });
                                    contractInstance.getDataVariableParam2.call("Risc0ParamName2", (err, result) => {
                                        if(!err){ console.log(result); risc0ParamName2 = result; executeRISC0_Function();}
                                        else console.log('Error:',err);
                                    });
                                    
                                    contractInstance['reply_callbak'](index, 1, {from: web3.eth.accounts[0], gas: 3000000}, (err, result) => {
                                        if (!err) {
                                            console.log('----------------------------------------------------------------------------------------------');
                                            console.log(`${serviceInfo.oracleName} CALLBACK STARTED WITH INDEX ${index}`);
                                            console.log("CONTRACT ", serviceInfo.address);    
                                            console.log('----------------------------------------------------------------------------------------------');
                                        } else {
                                            console.log('----------------------------------------------------------------------------------------------');
                                            console.log('Error:', err);
                                            console.log('----------------------------------------------------------------------------------------------');
                                        }
                                    });
                                if(result=="CrossChainFunction"){
                                    console.log(result);
                                    contractInstance['reply_callbak'](index, 1, {from: web3.eth.accounts[0], gas: 3000000}, (err, result) => {
                                        if (!err) {
                                            console.log('----------------------------------------------------------------------------------------------');
                                            console.log(`${serviceInfo.oracleName} CALLBACK STARTED WITH INDEX ${index}`);
                                            console.log("CONTRACT ", serviceInfo.address);    
                                            console.log('----------------------------------------------------------------------------------------------');
                                        } else {
                                            console.log('----------------------------------------------------------------------------------------------');
                                            console.log('Error:', err);
                                            console.log('----------------------------------------------------------------------------------------------');
                                        }
                                    });
                                }
                                
                            } else {
                                console.log('Error:', err);                               
                            }
                        }); 
                        
                      }
                  });
              }) 
          })
      }
      else{
        console.log('Transactions array is empty');
      }
  }
});

//跨链
var loadOracles = () => {
    var parameters = [new ParameterInfo('uint', 'monthlyRevenue'), new ParameterInfo('uint', 'loadAmount')];
    var Assess_Loan_Risk = new OracleInfo('Assess_Loan_Risk', parameters);
    // var parameters = [new ParameterInfo('string memory', 'crossChainFunc'), new ParameterInfo('string memory', 'crossChainParam1')];
    // var cross_name = new OracleInfo('cross_name', parameters);
    parseOracle(Assess_Loan_Risk);

    var Assess_Loan_Risk_sol = Assess_Loan_Risk.oracleName + '.sol';
    serviceStore.set(Assess_Loan_Risk_sol, Assess_Loan_Risk);

    var parameters2 = [new ParameterInfo('uint', 'cost')];
    var Appraise_Property = new OracleInfo('Appraise_Property', parameters2);
    parseOracle(Appraise_Property);
    
    var Appraise_Property_sol = Appraise_Property.oracleName + '.sol';
    serviceStore.set(Appraise_Property_sol, Appraise_Property);

    try { 
        serviceStore.forEach(serviceInfo => {
           console.log(serviceInfo.solidity);
           serviceInfo.solname = serviceInfo.oracleName + "_Oracle";
           serviceInfo.oracleName = serviceInfo.oracleName + ".sol";           
           var input1 = {
            language: 'Solidity',
            sources: {
              [serviceInfo.oracleName]: {
                content: serviceInfo.solidity
              }
            },
            settings: {
              outputSelection: {
                '*': {
                  '*': ['abi', 'evm.bytecode']
                }
              }
            }
          };
           serviceInfo.contract = JSON.parse(solc.compile(JSON.stringify(input1))).contracts;
           console.log(serviceInfo.contract);
        })        
    } catch (e) {
        console.log(e);
    }
}

//跨链方法
var createOracles = (res) => {
    try { 
        loadOracles();
        var count = 0;
        serviceStore.forEach(serviceInfo => {
            Object.keys(serviceInfo.contract).forEach(entryContract => {
                console.log('----------------------------------------------------------------------------------------------');
                console.log(`STARTING WITH ${entryContract.split(":")[0]} ORACLE CREATION`, );
                console.log(serviceInfo.solname);
                console.log('----------------------------------------------------------------------------------------------');
                let ProcessContract = web3.eth.contract(serviceInfo.contract[entryContract][serviceInfo.solname].abi);
                web3.personal.unlockAccount(web3.eth.accounts[0], '', 600);
                ProcessContract.new('0x857133c5C69e6Ce66F7AD46F200B9B3573e77582',
                {from:  web3.eth.accounts[0], data: "0x" + serviceInfo.contract[entryContract][serviceInfo.solname].evm.bytecode.object, gas: 4000000},
                (err, contract) => {
                    if (err) {
                        console.log('error ', err);
                    } else if (contract.address) {
                        serviceStore.get(serviceInfo.oracleName).address = contract.address;
                        serviceStore.get(serviceInfo.oracleName).entryContractName = entryContract;
                        let checksumAddress = toChecksumAddress(contract.address);
                        Register_Function(checksumAddress);
                        console.log('----------------------------------------------------------------------------------------------');
                        console.log(`${entryContract.split(":")[0]} CREATED AT ADDRESS `, contract.address.toString());
                        console.log('----------------------------------------------------------------------------------------------');
                        if (count++ == 2)
                            res.status(201).send("Done");
                    } 
                }
            );
            })
        })
    } catch (e) {
        console.log(e);
    }   
}



models.post('/services', (req, res) => {
    try {
        createOracles(res); 
    } catch (e) {
        console.log(e);
        res.status(400).send(e);
    }
});

models.get('/services/:serviceID', (req, res) => {
  let oracleID = req.params.serviceID + ".sol";
  console.log('----------------------------------------------------------------------------------------------');
  console.log('QUERYING SERVICE INFO: ', oracleID);
  if (serviceStore.has(oracleID)) {
      console.log("CONTRACT NAME: ", serviceStore.get(oracleID).entryContractName);
      console.log("CONTRACT ADDRESS: ", serviceStore.get(oracleID).address);
      console.log("SOLIDITY CODE: ", serviceStore.get(oracleID).solidity);
      console.log('----------------------------------------------------------------------------------------------');
      res.status(200).send(JSON.stringify({entryContractName: serviceStore.get(oracleID).entryContractName, address: serviceStore.get(oracleID).address, solidity: serviceStore.get(oracleID).solidity}));
  } else {
      console.log('----------------------------------------------------------------------------------------------');
      res.status(404).send('Oracle not found');
      console.log('----------------------------------------------------------------------------------------------');
  }   
});

models.get('/services', (req, res) => {
  console.log('QUERYING ALL ACTIVE ORACLES');
  var actives = [];
  serviceStore.forEach(serviceInfo => {
      console.log({name: serviceInfo.oracleName, address: serviceInfo.address });
      console.log('----------------------------------------------------------------------------------------------');
      actives.push({name: serviceInfo.oracleName, address: serviceInfo.address })
  });
  if (actives.length > 0 ) {
      res.status(200).send(actives);
  } else
      res.status(404).send('There are not running oracles');
});

export default models;