#!/bin/bash

/root/go/bin/goduck ether contract invoke --key-path $HOME/goduck/scripts/docker/quick_start/account.key --abi-path $HOME/goduck/scripts/example/broker.abi --address http://localhost:8545 0x857133c5C69e6Ce66F7AD46F200B9B3573e77582 audit "$1^1"

cd /root/.goduck/pier/.pier_ethereum/

random_number=$RANDOM
output=$(/root/go/bin/pier --repo ./ appchain service register --appchain-id "ethappchain1" --service-id "$1" --name "ethService${random_number}" --intro "" --type CallContract --permit "" --details "test"--reason "reason")
data=$(echo $output | sed 's/.*proposal \(.*\) to finish.*/\1/')

/root/go/bin/bitxhub --repo /root/bitxhub/scripts/build/node1 client governance vote --id $data --info approve --reason reason
/root/go/bin/bitxhub --repo /root/bitxhub/scripts/build/node2 client governance vote --id $data --info approve --reason reason
/root/go/bin/bitxhub --repo /root/bitxhub/scripts/build/node3 client governance vote --id $data --info approve --reason reason

/root/go/bin/bitxhub --repo  /root/bitxhub/scripts/build/node1 client governance service status --id "ethappchain1:$1"

echo $output
echo $data
echo "success"
