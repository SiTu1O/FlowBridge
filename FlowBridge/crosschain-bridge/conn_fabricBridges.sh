#!/bin/bash

goduck fabric clean
sleep 2

goduck fabric start
sleep 2

goduck fabric contract chaincode --bxh-version v1.23.0
sleep 2

bitxhub client transfer --key /root/bitxhub/scripts/build/node1/key.json --to 0x98a9882C3054Cf4bC77217807d62B4D3e67129ea --amount 100000000000000000

cd /root/.goduck/pier/.pier_fabric/

pier --repo ./ appchain register --appchain-id "appchain1" --name "fabric1" --type "Fabric V1.4.3" --trustroot $HOME/.goduck/pier/.pier_fabric/fabric/fabric.validators --broker-cid mychanncel --broker-ccid broker --broker-v 1 --desc "desc" --master-rule "0x00000000000000000000000000000000000000a2" --rule-url "http://github.com" --admin 0x98a9882C3054Cf4bC77217807d62B4D3e67129ea --reason "reason"

bitxhub --repo /root/bitxhub/scripts/build/node1 client governance vote --id 0x98a9882C3054Cf4bC77217807d62B4D3e67129ea-0 --info approve --reason reason
bitxhub --repo /root/bitxhub/scripts/build/node2 client governance vote --id 0x98a9882C3054Cf4bC77217807d62B4D3e67129ea-0 --info approve --reason reason
bitxhub --repo /root/bitxhub/scripts/build/node3 client governance vote --id 0x98a9882C3054Cf4bC77217807d62B4D3e67129ea-0 --info approve --reason reason

pier --repo ./ appchain service register --appchain-id "appchain1" --service-id "mychannel&transfer" --name "fabServer1" --intro "" --type CallContract --permit "" --details "test"--reason "reason"

bitxhub --repo /root/bitxhub/scripts/build/node1 client governance vote --id 0x98a9882C3054Cf4bC77217807d62B4D3e67129ea-1 --info approve --reason reason
bitxhub --repo /root/bitxhub/scripts/build/node2 client governance vote --id 0x98a9882C3054Cf4bC77217807d62B4D3e67129ea-1 --info approve --reason reason
bitxhub --repo /root/bitxhub/scripts/build/node3 client governance vote --id 0x98a9882C3054Cf4bC77217807d62B4D3e67129ea-1 --info approve --reason reason

pier --repo ./ appchain service register --appchain-id "appchain1" --service-id "mychannel&data_swapper" --name "fabServer2" --intro "" --type CallContract --permit "" --details "test"--reason "reason"

bitxhub --repo /root/bitxhub/scripts/build/node1 client governance vote --id 0x98a9882C3054Cf4bC77217807d62B4D3e67129ea-2 --info approve --reason reason
bitxhub --repo /root/bitxhub/scripts/build/node2 client governance vote --id 0x98a9882C3054Cf4bC77217807d62B4D3e67129ea-2 --info approve --reason reason
bitxhub --repo /root/bitxhub/scripts/build/node3 client governance vote --id 0x98a9882C3054Cf4bC77217807d62B4D3e67129ea-2 --info approve --reason reason

bitxhub --repo  /root/bitxhub/scripts/build/node1 client governance appchain info --name "fabric1"
bitxhub --repo  /root/bitxhub/scripts/build/node1 client governance appchain status --id "appchain1"
bitxhub --repo  /root/bitxhub/scripts/build/node1 client governance service status --id "appchain1:mychannel&transfer"
bitxhub --repo  /root/bitxhub/scripts/build/node1 client governance service status --id "appchain1:mychannel&data_swapper"

cd /root/.goduck/pier/.pier_fabric
pier --repo ./ start

