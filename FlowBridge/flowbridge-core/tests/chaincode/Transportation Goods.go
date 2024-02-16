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
	Type     string         `json:"type"`
	ID       string         `json:"id"`
	Name     string         `json:"name"`
	Token    int            `json:"token"`
	XORtoken []string       `json:"xortoken"`
	ANDtoken map[string]int `json:"andtoken"`
	Children []string       `json:"children"`
	Lane     string         `json:"lane"`
}

/*
 * The Init method is called when the Smart Contract is instantiated by the blockchain network
 */
func (s *SmartContract) Init(APIstub shim.ChaincodeStubInterface) peer.Response {
	var StartIDs []string
	var EventIDs []string
	Functions := map[string]string{}
	var event Event
	var eventAsBytes []byte
	Element = Element{
		Type:     "task",
		ID:       "Task_10p2885",
		Name:     "Recorded Goods",
		Token:    0,
		XORtoken: []string{},
		ANDtoken: map[string]int{},
		Children: []string{"Task_1r6jqc1"},
	}
	Functions[event.Name] = event.ID
	eventAsBytes, _ = json.Marshal(event)
	APIstub.PutState(event.ID, eventAsBytes)
	EventIDs = append(EventIDs, event.ID)

	Element = Element{
		Type:     "task",
		ID:       "Task_1r6jqc1",
		Name:     "Transported Goods",
		Token:    0,
		XORtoken: []string{},
		ANDtoken: map[string]int{},
		Children: []string{"EndEvent_025wuik"},
	}
	Functions[event.Name] = event.ID
	eventAsBytes, _ = json.Marshal(event)
	APIstub.PutState(event.ID, eventAsBytes)
	EventIDs = append(EventIDs, event.ID)

	Element = Element{
		Type:     "START",
		ID:       "StartEvent_0oxs8ze",
		Name:     "undefined",
		Token:    0,
		XORtoken: []string{},
		ANDtoken: map[string]int{},
		Children: []string{"Task_10p2885"},
	}

	eventAsBytes, _ = json.Marshal(event)
	APIstub.PutState(event.ID, eventAsBytes)
	EventIDs = append(EventIDs, event.ID)
	StartIDs = append(StartIDs, event.ID)

	Element = Element{
		Type:     "END",
		ID:       "EndEvent_025wuik",
		Name:     "undefined",
		Token:    0,
		XORtoken: []string{},
		ANDtoken: map[string]int{},
		Children: []string{},
	}

	eventAsBytes, _ = json.Marshal(event)
	APIstub.PutState(event.ID, eventAsBytes)
	EventIDs = append(EventIDs, event.ID)

	EventIDsAsBytes, _ := json.Marshal(EventIDs)
	APIstub.PutState("EventIDs", EventIDsAsBytes)
	StartIDsAsBytes, _ := json.Marshal(StartIDs)
	APIstub.PutState("StartIDs", StartIDsAsBytes)
	FunctionsAsBytes, _ := json.Marshal(Functions)
	APIstub.PutState("Functions", FunctionsAsBytes)
	initAsBytes, _ := json.Marshal(0)
	APIstub.PutState("InitLedger", initAsBytes)

	return shim.Success(nil)
}

func (s *SmartContract) initLedger(APIstub shim.ChaincodeStubInterface) peer.Response {
	initAsBytes, _ := APIstub.GetState("InitLedger")
	init := 0
	json.Unmarshal(initAsBytes, &init)

	if init == 1 {
		return shim.Error("Ledger has already been initialized.")
	}

	StartIDsAsBytes, err := APIstub.GetState("StartIDs")
	if err != nil {
		return shim.Error(err.Error())
	}
	StartIDs := []string{}
	json.Unmarshal(StartIDsAsBytes, &StartIDs)

	for _, id := range StartIDs {
		startEvent, err := s.GetEvent(APIstub, id)
		if err != nil {
			return shim.Error(err.Error())
		}
		for _, childID := range startEvent.Children {
			err = s.PropagateToken(APIstub, childID, id)
			if err != nil {
				return shim.Error(err.Error())
			}
		}
	}

	initAsBytes, _ = json.Marshal(1)
	APIstub.PutState("InitLedger", initAsBytes)
	return shim.Success(nil)
}

func (s *SmartContract) CheckAccess(caller string, task Event) bool {
	return task.Lane == caller
}

func (s *SmartContract) DoTask(APIstub shim.ChaincodeStubInterface, targetEvent Event) (bool, error) {
	if targetEvent.Type == "task" {
		if targetEvent.Token > 0 {
			s.ConsumeToken(APIstub, targetEvent)
			for _, childID := range targetEvent.Children {
				err := s.PropagateToken(APIstub, childID, targetEvent.ID)
				if err != nil {
					return false, err
				}
			}
			return true, nil
		} else if len(targetEvent.XORtoken) > 0 {
			// Consume XOR token in order
			xorID := targetEvent.XORtoken[0]
			xor, err := s.GetEvent(APIstub, xorID)
			if err != nil {
				return false, err
			}
			err = s.ConsumeToken(APIstub, xor)
			if err != nil {
				return false, err
			}
			for _, childID := range xor.Children {
				// revoke this XOR token from its children
				err = s.ConsumeXORToken(APIstub, childID, xorID)
				if err != nil {
					return false, err
				}
			}
			// Now propagate a token to current event's children
			for _, childID := range targetEvent.Children {
				err = s.PropagateToken(APIstub, childID, targetEvent.ID)
				if err != nil {
					return false, err
				}
			}
			return true, nil
		} else {
			return false, nil
		}
	} else {
		return false, errors.New("Event type unexecutable: " + targetEvent.ID + ", " + targetEvent.Type)
	}
}

func (s *SmartContract) LocalTask(APIstub shim.ChaincodeStubInterface, targetEvent Event) (bool, error) {
	if targetEvent.Type == "task" {
		if targetEvent.Token > 0 || len(targetEvent.XORtoken) > 0 {
			return true, nil
		} else {
			return false, nil
		}
	} else {
		return false, errors.New("Event type unexecutable: " + targetEvent.ID + ", " + targetEvent.Type)
	}
}

func (s *SmartContract) ConsumeToken(APIstub shim.ChaincodeStubInterface, event Event) error {
	event.Token -= 1
	return s.PutEvent(APIstub, event)
}

func (s *SmartContract) PropagateToken(APIstub shim.ChaincodeStubInterface, targetEventID string, sourceID string) error {
	targetEvent, err := s.GetEvent(APIstub, targetEventID)
	if err != nil {
		return err
	}

	if targetEvent.Type == "task" {
		targetEvent.Token += 1
		return s.PutEvent(APIstub, targetEvent)
	} else if targetEvent.Type == "END" {
		targetEvent.Token += 1
		s.PutEvent(APIstub, targetEvent)
		return nil
	} else if targetEvent.Type == "AND" {
		// check all
		targetEvent.ANDtoken[sourceID] += 1
		for _, token := range targetEvent.ANDtoken {
			if token == 0 {
				return s.PutEvent(APIstub, targetEvent)
			}
		}
		for parentID, _ := range targetEvent.ANDtoken {
			targetEvent.ANDtoken[parentID] -= 1
		}
		err = s.PutEvent(APIstub, targetEvent)
		if err != nil {
			return err
		}
		for _, childID := range targetEvent.Children {
			err = s.PropagateToken(APIstub, childID, targetEvent.ID)
			if err != nil {
				return err
			}
		}
		return nil
	} else if targetEvent.Type == "XOR" {
		if len(targetEvent.Children) <= 1 {
			// Deterministic outgoing flow. Treat as normal token.
			for _, childID := range targetEvent.Children {
				err = s.PropagateToken(APIstub, childID, targetEvent.ID)
				if err != nil {
					return err
				}
			}
			return nil
		} else {
			targetEvent.Token += 1
			err = s.PutEvent(APIstub, targetEvent)
			if err != nil {
				return err
			}
			for _, childID := range targetEvent.Children {
				err = s.PropagateXORToken(APIstub, childID, targetEvent.ID)
				if err != nil {
					return err
				}
			}
			return nil
		}
	} else {
		for _, childID := range targetEvent.Children {
			err = s.PropagateToken(APIstub, childID, targetEvent.ID)
			if err != nil {
				return err
			}
		}
		return nil
	}
}

func (s *SmartContract) PropagateXORToken(APIstub shim.ChaincodeStubInterface, targetEventID string, xorID string) error {
	targetEvent, err := s.GetEvent(APIstub, targetEventID)
	if err != nil {
		return err
	}
	if targetEvent.Type == "task" {
		targetEvent.XORtoken = append(targetEvent.XORtoken, xorID)
		return s.PutEvent(APIstub, targetEvent)
	} else if targetEvent.Type == "event" {
		for _, childID := range targetEvent.Children {
			err = s.PropagateXORToken(APIstub, childID, xorID)
			if err != nil {
				return err
			}
		}
		return nil
	} else {
		// Unsupported
		return errors.New("Attaching another gateway immediately after an exclusive gateway is not supported.")
	}
}

func (s *SmartContract) ConsumeXORToken(APIstub shim.ChaincodeStubInterface, targetEventID string, xorID string) error {
	targetEvent, err := s.GetEvent(APIstub, targetEventID)
	if err != nil {
		return err
	}
	if targetEvent.Type == "task" {
		for i, tokenID := range targetEvent.XORtoken {
			if tokenID == xorID {
				targetEvent.XORtoken = append(targetEvent.XORtoken[:i], targetEvent.XORtoken[i+1:]...)
				return s.PutEvent(APIstub, targetEvent)
			}
		}
		return errors.New("ConsumeXORToken Error: didn't find token " + xorID + " for " + targetEventID) // This should not happen
	} else if targetEvent.Type == "event" {
		for _, childID := range targetEvent.Children {
			err = s.ConsumeXORToken(APIstub, childID, xorID)
			if err != nil {
				return err
			}
		}
		return nil
	} else {
		// Unsupported
		return errors.New("Attaching another gateway to an exclusive gateway is not supported.")
	}
}

func (s *SmartContract) GetEvent(APIstub shim.ChaincodeStubInterface, eventID string) (Event, error) {
	eventAsBytes, err := APIstub.GetState(eventID)
	if err != nil {
		return Event{}, err
	}
	targetEvent := Event{}
	json.Unmarshal(eventAsBytes, &targetEvent)
	return targetEvent, nil
}

func (s *SmartContract) PutEvent(APIstub shim.ChaincodeStubInterface, event Event) error {
	eventAsBytes, _ := json.Marshal(event)
	return APIstub.PutState(event.ID, eventAsBytes)
}

func (s *SmartContract) GetCaller(APIstub shim.ChaincodeStubInterface) (string, string, error) {
	// GetCreator returns marshaled serialized identity of the client
	creatorByte, _ := APIstub.GetCreator()
	certStart := bytes.IndexAny(creatorByte, "-----BEGIN")
	if certStart == -1 {
		return "", "", errors.New("No certificate found")
	}
	certText := creatorByte[certStart:]
	bl, _ := pem.Decode(certText)
	if bl == nil {
		return "", "", errors.New("Could not decode the PEM structure")
	}

	cert, err := x509.ParseCertificate(bl.Bytes)
	if err != nil {
		return "", "", errors.New("ParseCertificate failed")
	}
	caller := cert.Subject.CommonName
	domainStart := strings.Index(caller, "@")
	if domainStart == -1 {
		return "", "", errors.New("Could not parce certificate domain")
	}
	user := caller[:domainStart+1]
	domain := caller[domainStart+1:]
	return user, domain, nil
}

/*
 * The Invoke method is called as a result of an application request to run the Smart Contract
 * The calling application program has also specified the particular smart contract function to be called
 */
func (s *SmartContract) Invoke(APIstub shim.ChaincodeStubInterface) peer.Response {
	// Retrieve the requested Smart Contract function and arguments
	function, args := APIstub.GetFunctionAndParameters()
	if function == "queryEvent" {
		return s.queryEvent(APIstub, args)
	} else if function == "queryAllEvents" {
		return s.queryAllEvents(APIstub)
	} else if function == "initLedger" {
		return s.initLedger(APIstub)
	} else if function == "resetLedger" { // This is for testing purpose only
		return s.Init(APIstub)
	} else if function == "register" {
		return s.register(APIstub)
	} else if function == "interchainGet" {
		return s.interchainGet(APIstub, args)
	} else if function == "interchainSet" {
		return s.interchainSet(APIstub, args)
	} else if function == "get" {
		return s.get(APIstub, args)
	} else if function == "set" {
		return s.set(APIstub, args)
	} else if function == "_localCall" {
		if len(args) == 0 {
			return shim.Error("Must provide a function name.")
		}

		local_function := args[0]

		FunctionsAsBytes, err := APIstub.GetState("Functions")
		if err != nil {
			return shim.Error(err.Error())
		}

		Functions := map[string]string{}
		json.Unmarshal(FunctionsAsBytes, &Functions)

		if Functions[local_function] == "" {
			return shim.Error("Invalid function name.")
		}

		taskEvent, err := s.GetEvent(APIstub, Functions[local_function])
		if err != nil {
			return shim.Error(err.Error())
		}

		// At the moment, we only care about the caller's domain
		_, caller, err := s.GetCaller(APIstub)
		if err != nil {
			return shim.Error(err.Error())
		}
		if s.CheckAccess(caller, taskEvent) {
			success, err := s.LocalTask(APIstub, taskEvent)
			if err != nil {
				return shim.Error(err.Error())
			} else if success {
				return shim.Success([]byte("This function call is valid."))
			} else {
				return shim.Error("Requested function does not follow the business logic.")
			}
		} else {
			return shim.Error(caller + " does not have access to function " + local_function)
		}
	} else {
		FunctionsAsBytes, err := APIstub.GetState("Functions")
		if err != nil {
			return shim.Error(err.Error())
		}

		Functions := map[string]string{}
		json.Unmarshal(FunctionsAsBytes, &Functions)

		if Functions[function] == "" {
			return shim.Error("Invalid function name.")
		}

		taskEvent, err := s.GetEvent(APIstub, Functions[function])
		if err != nil {
			return shim.Error(err.Error())
		}

		// At the moment, we only care about the caller's domain
		_, caller, err := s.GetCaller(APIstub)
		if err != nil {
			return shim.Error(err.Error())
		}
		if s.CheckAccess(caller, taskEvent) {
			success, err := s.DoTask(APIstub, taskEvent)
			if err != nil {
				return shim.Error(err.Error())
			} else if success {
				return shim.Success(nil)
			} else {
				return shim.Error("Requested function does not follow the business logic.")
			}
		} else {
			return shim.Error(caller + " does not have access to function " + function)
		}
	}
}

func (s *SmartContract) queryEvent(APIstub shim.ChaincodeStubInterface, args []string) peer.Response {

	if len(args) != 1 {
		return shim.Error("Incorrect number of arguments. Expecting 1")
	}
	eventAsBytes, err := APIstub.GetState(args[0])
	if err != nil {
		return shim.Error(err.Error())
	}
	return shim.Success(eventAsBytes)
}

func (s *SmartContract) queryAllEvents(APIstub shim.ChaincodeStubInterface) peer.Response {

	// buffer is a JSON array containing QueryResults
	var buffer bytes.Buffer

	var EventIDs []string
	EventIDsAsBytes, err := APIstub.GetState("EventIDs")
	if err != nil {
		return shim.Error(err.Error())
	}
	json.Unmarshal(EventIDsAsBytes, &EventIDs)
	buffer.WriteString("\n")
	for _, eventID := range EventIDs {
		event, err := s.GetEvent(APIstub, eventID)
		if err != nil {
			return shim.Error(err.Error())
		}
		// Add a comma before array members, suppress it for the first array member
		buffer.WriteString("{Event ID: ")
		buffer.WriteString(event.ID)
		buffer.WriteString(", Name: ")
		buffer.WriteString(event.Name)
		buffer.WriteString(", Token: ")
		buffer.WriteString(strconv.Itoa(event.Token))
		if len(event.XORtoken) > 0 {
			buffer.WriteString(", XORtoken: [")
			for _, xortoken := range event.XORtoken {
				buffer.WriteString(xortoken)
				buffer.WriteString(",")
			}
			buffer.WriteString("]")
		}
		buffer.WriteString("}\n")
	}

	fmt.Printf("- queryAllEvents:\n%s\n", buffer.String())
	return shim.Success(buffer.Bytes())
}

// broker注册
func (s *SmartContract) register(APIstub shim.ChaincodeStubInterface) peer.Response {
	args := util.ToChaincodeArgs("register")
	response := APIstub.InvokeChaincode(brokerContractName, args, channelID)
	if response.Status != shim.OK {
		return shim.Error(fmt.Sprintf("invoke chaincode '%s' err: %s", brokerContractName, response.Message))
	}
	return response
}

// 下面四个是跨区块链的主要接口
func (s *SmartContract) get(APIstub shim.ChaincodeStubInterface, args []string) peer.Response {
	switch len(args) {
	case 1:
		// args[0]: key
		value, err := APIstub.GetState(args[0])
		if err != nil {
			return shim.Error(err.Error())
		}

		return shim.Success(value)
	case 2:
		// args[0]: destination service id
		// args[1]: key
		var callArgs, argsCb [][]byte
		callArgs = append(callArgs, []byte(args[1]))
		argsCb = append(argsCb, []byte(args[1]))

		callArgsBytes, err := json.Marshal(callArgs)
		if err != nil {
			return shim.Error(err.Error())
		}
		argsCbBytes, err := json.Marshal(argsCb)
		if err != nil {
			return shim.Error(err.Error())
		}

		b := util.ToChaincodeArgs(emitInterchainEventFunc, args[0], "interchainGet", string(callArgsBytes), "interchainSet", string(argsCbBytes), "", "", strconv.FormatBool(false))
		response := APIstub.InvokeChaincode(brokerContractName, b, channelID)
		if response.Status != shim.OK {
			return shim.Error(fmt.Errorf("invoke broker chaincode %s error: %s", brokerContractName, response.Message).Error())
		}

		return shim.Success(nil)
	default:
		return shim.Error("incorrect number of arguments")
	}
}

// get is business function which will invoke the to,tid,id
func (s *SmartContract) set(APIstub shim.ChaincodeStubInterface, args []string) peer.Response {
	if len(args) != 2 {
		return shim.Error("incorrect number of arguments")
	}

	err := APIstub.PutState(args[0], []byte(args[1]))
	if err != nil {
		return shim.Error(err.Error())
	}

	return shim.Success(nil)
}

// interchainSet is the callback function getting data by interchain
func (s *SmartContract) interchainSet(APIstub shim.ChaincodeStubInterface, args []string) peer.Response {
	return s.set(APIstub, args)
}

// interchainGet gets data by interchain
func (s *SmartContract) interchainGet(APIstub shim.ChaincodeStubInterface, args []string) peer.Response {
	value, err := APIstub.GetState(args[0])
	s.initLedger(APIstub)

	FunctionsAsBytes, err := APIstub.GetState("Functions")
	if err != nil {
		return shim.Error(err.Error())
	}

	Functions := map[string]string{}
	json.Unmarshal(FunctionsAsBytes, &Functions)

	taskEvent1, err := s.GetEvent(APIstub, Functions["START"])
	s.DoTask(APIstub, taskEvent1)
	taskEvent2, err := s.GetEvent(APIstub, Functions["Recorded Goods"])
	s.DoTask(APIstub, taskEvent2)
	taskEvent3, err := s.GetEvent(APIstub, Functions["Transported Goods"])
	s.DoTask(APIstub, taskEvent3)

	if err != nil {
		return shim.Error(err.Error())
	}
	return shim.Success(value)
}

// The main function is only relevant in unit test mode. Only included here for completeness.
func main() {
	// Create a new Smart Contract
	err := shim.Start(new(SmartContract))
	if err != nil {
		fmt.Printf("Error creating new Smart Contract: %s", err)
	}
}
