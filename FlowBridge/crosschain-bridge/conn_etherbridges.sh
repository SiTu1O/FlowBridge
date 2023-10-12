#!/bin/bash

goduck ether clean
/root/goduck/scripts/ethereum.sh docker 8545 8546 30303 1.2.0

echo "Waiting for services to start"
sleep 2

goduck ether contract deploy --code-path $HOME/goduck/scripts/example/broker.sol "1356^ethappchain1^["0xc7F999b83Af6DF9e67d0a37Ee7e900bF38b3D013","0x79a1215469FaB6f9c63c1816b45183AD3624bE34","0x97c8B516D19edBf575D72a172Af7F418BE498C37","0xc0Ff2e0b3189132D815b8eb325bE17285AC898f8"]^1^["0x20F7Fac801C5Fc3f7E20cFbADaA1CDb33d818Fa3"]^1"

goduck ether contract deploy --code-path $HOME/goduck/scripts/example/transfer.sol 0x857133c5C69e6Ce66F7AD46F200B9B3573e77582

goduck ether contract deploy --code-path $HOME/goduck/scripts/example/data_swapper.sol 0x857133c5C69e6Ce66F7AD46F200B9B3573e77582

goduck ether contract invoke --key-path $HOME/goduck/scripts/docker/quick_start/account.key --abi-path $HOME/goduck/scripts/example/broker.abi --address http://localhost:8545 0x857133c5C69e6Ce66F7AD46F200B9B3573e77582 audit "0x30c5D3aeb4681af4D13384DBc2a717C51cb1cc11^1"

goduck ether contract invoke --key-path $HOME/goduck/scripts/docker/quick_start/account.key --abi-path $HOME/goduck/scripts/example/broker.abi --address http://localhost:8545 0x857133c5C69e6Ce66F7AD46F200B9B3573e77582 audit "0xe95C4c9D9DFeAdC8aD80F87de3F36476DcDdE9F4^1"


bitxhub client transfer --key /root/bitxhub/scripts/build/node1/key.json --to 0x5055C802Dab256360C3549eaA6E66460463e52e5 --amount 100000000000000000

cd /root/.goduck/pier/.pier_ethereum/

pier --repo ./ appchain register --appchain-id "ethappchain1" --name "eth1" --type "ETH" --trustroot $HOME/.goduck/pier/.pier_ethereum/ethereum/ether.validators --broker 0x857133c5C69e6Ce66F7AD46F200B9B3573e77582 --desc "desc" --master-rule "0x00000000000000000000000000000000000000a2" --rule-url "http://github.com" --admin 0x5055C802Dab256360C3549eaA6E66460463e52e5 --reason "reason"

bitxhub --repo /root/bitxhub/scripts/build/node1 client governance vote --id 0x5055C802Dab256360C3549eaA6E66460463e52e5-0 --info approve --reason reason
bitxhub --repo /root/bitxhub/scripts/build/node2 client governance vote --id 0x5055C802Dab256360C3549eaA6E66460463e52e5-0 --info approve --reason reason
bitxhub --repo /root/bitxhub/scripts/build/node3 client governance vote --id 0x5055C802Dab256360C3549eaA6E66460463e52e5-0 --info approve --reason reason

cd /root/.goduck/pier/.pier_ethereum/

pier --repo ./ appchain service register --appchain-id "ethappchain1" --service-id "0x30c5D3aeb4681af4D13384DBc2a717C51cb1cc11" --name "ethService" --intro "" --type CallContract --permit "" --details "test"--reason "reason"

bitxhub --repo /root/bitxhub/scripts/build/node1 client governance vote --id 0x5055C802Dab256360C3549eaA6E66460463e52e5-1 --info approve --reason reason
bitxhub --repo /root/bitxhub/scripts/build/node2 client governance vote --id 0x5055C802Dab256360C3549eaA6E66460463e52e5-1 --info approve --reason reason
bitxhub --repo /root/bitxhub/scripts/build/node3 client governance vote --id 0x5055C802Dab256360C3549eaA6E66460463e52e5-1 --info approve --reason reason

pier --repo ./ appchain service register --appchain-id "ethappchain1" --service-id "0xe95C4c9D9DFeAdC8aD80F87de3F36476DcDdE9F4" --name "ethService1" --intro "" --type CallContract --permit "" --details "test"--reason "reason"

bitxhub --repo /root/bitxhub/scripts/build/node1 client governance vote --id 0x5055C802Dab256360C3549eaA6E66460463e52e5-2 --info approve --reason reason
bitxhub --repo /root/bitxhub/scripts/build/node2 client governance vote --id 0x5055C802Dab256360C3549eaA6E66460463e52e5-2 --info approve --reason reason
bitxhub --repo /root/bitxhub/scripts/build/node3 client governance vote --id 0x5055C802Dab256360C3549eaA6E66460463e52e5-2 --info approve --reason reason

bitxhub --repo  /root/bitxhub/scripts/build/node1 client governance appchain info --name "eth1"
bitxhub --repo  /root/bitxhub/scripts/build/node1 client governance appchain status --id "ethappchain1"
bitxhub --repo  /root/bitxhub/scripts/build/node1 client governance service status --id "ethappchain1:0x30c5D3aeb4681af4D13384DBc2a717C51cb1cc11"
bitxhub --repo  /root/bitxhub/scripts/build/node1 client governance service status --id "ethappchain1:0xe95C4c9D9DFeAdC8aD80F87de3F36476DcDdE9F4"

cd /root/.goduck/pier/.pier_ethereum
pier --repo ./ start

