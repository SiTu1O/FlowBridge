package main
import (
	"bytes"
	"crypto/x509"
	"encoding/json"
	"encoding/pem"
	"errors"
	"fmt"
	"strconv"
	"strings"

	"github.com/hyperledger/fabric/common/util"
	"github.com/hyperledger/fabric/core/chaincode/shim"
	"github.com/hyperledger/fabric/protos/peer"
)

const (
	channelID               = "mychannel"
	brokerContractName      = "broker"
	emitInterchainEventFunc = "EmitInterchainEvent"
)


// Define the Smart Contract structure
type SmartContract struct {
}


// Define the Event structure. Structure tags are used by encoding/json library
type Event struct {
    Type string \`json:"type"\`
    ID string \`json:"id"\`
    Name  string \`json:"name"\`
    Token int \`json:"token"\`
    XORtoken []string \`json:"xortoken"\`
    ANDtoken map[string]int \`json:"andtoken"\`
    Children []string \`json:"children"\`
    Lane string \`json:"lane"\`
}


/*
 * The Init method is called when the Smart Contract is instantiated by the blockchain network
 */
func (s *SmartContract) Init(APIstub shim.ChaincodeStubInterface) peer.Response {
    var StartIDs []string
    var EventIDs []string
    Functions := map[string]string {}
    var event Event
    var eventAsBytes []byte