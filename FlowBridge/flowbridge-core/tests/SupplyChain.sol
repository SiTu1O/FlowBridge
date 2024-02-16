// SPDX-License-Identifier: SimPL-2.0
 pragma solidity >=0.5.6;
  pragma experimental ABIEncoderV2;



            contract Supply_Chain_Contract {
    uint tokens = 2;
    address owner = address(0);
    address parent = address(0);
    uint subprocesses = 0;
    uint [] requestedID;

    mapping(string => string) dataM;
    // change the address of Broker accordingly
    address BrokerAddr;

    // AccessControl
    modifier onlyBroker {
        require(msg.sender == BrokerAddr, "Invoker are not the Broker");
        _;
    }

    function register() public {
        Broker(BrokerAddr).register();
    }


            event Element_Execution_Completed(uint elementId);
    Supply_Chain_WorkList workList = new Supply_Chain_WorkList();

    uint active_Purchas_Order = 0;
    uint active_Production_Raw_Material = 0;
    uint active_Production_Goods = 0;
    uint active_Transportation_Goods = 0;
    uint active_Raw_Material_Invoicing = 0;
    uint active_Goods_Invoicing = 0;

            string Order = '';
string  Raw_Material = '';
string Goods = '';
string Transportation = '';
string RawMaterialInvoice = '';
string GoodsInvoice = '';    
bool processFlag = true;


            constructor(address _brokerAddr) public{
        BrokerAddr = 0x857133c5C69e6Ce66F7AD46F200B9B3573e77582;
        Broker(BrokerAddr).register();
        owner = msg.sender;
        for (uint i = 0; i < 0; i++)
            requestedID.push(0);
        step(tokens);
    }

    function setParent(address newParent) public{
        if (owner == msg.sender)
            parent = newParent;
    }

    function handleGlobalDefaultEnd() public{
        // ................ Nothing to do ...........
    }



    function handleGlobalErrorEnd(bytes32 eventName) public{
        if (parent != address(0))
            Supply_Chain_Contract(parent).handleGlobalErrorEnd(eventName);
        else
            tokens &= uint(~kill_Supply_Chain());
     }



    function handleGlobalEscalationEnd(bytes32 eventName) public{
        if (parent != address(0))
            Supply_Chain_Contract(parent).handleGlobalEscalationEnd(eventName);
     }

    function kill_Supply_Chain() public returns (uint) {
        uint tokensToKill = 0;
        tokensToKill |= uint(2046);
        active_Purchas_Order = 0;
        active_Production_Raw_Material = 0;
        active_Production_Goods = 0;
        active_Transportation_Goods = 0;
        active_Raw_Material_Invoicing = 0;
        active_Goods_Invoicing = 0;
        tokens &= uint(~tokensToKill);
        return 0;
    }

     function broadcastSignal_Supply_Chain() public{
        // Nothing to do ...
    }

            function Event_1exrr46(uint localTokens) internal returns (uint) {
        tokens = localTokens & uint(~512);
        if (tokens & 2046 != 0) {
            return tokens;
        }
        if (parent != address(0))
            Supply_Chain_Contract(parent).handleGlobalDefaultEnd();
        emit Element_Execution_Completed(1);
        return tokens;
    }


    function Purchas_Order_start (uint localTokens) internal returns (uint) {

        uint reqId = workList.DefaultTask_start (this.Purchas_Order_callback);
        active_Purchas_Order |= uint(1) << reqId;
        return localTokens & uint(~2);
    }

    function Purchas_Order_callback (uint reqId) public returns (bool) {
        if (active_Purchas_Order == 0)
            return false;
        uint index = uint(1) << reqId;
        if(active_Purchas_Order & index == index) {
            active_Purchas_Order &= ~index;
            step (tokens | 4);
            emit Element_Execution_Completed(8);
            return true;
        }
        return false ;
    }


    function Production_Raw_Material_start (uint localTokens) internal returns (uint) {

        get("1356:appchain1:mychannel&Production_Raw_Material","Raw_Material");
        uint reqId = workList.DefaultTask_start (this.Production_Raw_Material_callback);
        active_Production_Raw_Material |= uint(1) << reqId;
        return localTokens & uint(~4);
    }

    function Production_Raw_Material_callback (uint reqId) public returns (bool) {
        if (active_Production_Raw_Material == 0)
            return false;
        uint index = uint(1) << reqId;
        if(active_Production_Raw_Material & index == index) {
            active_Production_Raw_Material &= ~index;
            step (tokens | 8);
            emit Element_Execution_Completed(16);
            return true;
        }
        return false ;
    }


    function Production_Goods_start (uint localTokens) internal returns (uint) {

        get("1356:appchain2:mychannel&Production_Goods","Goods");
        uint reqId = workList.DefaultTask_start (this.Production_Goods_callback);
        active_Production_Goods |= uint(1) << reqId;
        return localTokens & uint(~8);
    }

    function Production_Goods_callback (uint reqId) public returns (bool) {
        if (active_Production_Goods == 0)
            return false;
        uint index = uint(1) << reqId;
        if(active_Production_Goods & index == index) {
            active_Production_Goods &= ~index;
            step (tokens | 16);
            emit Element_Execution_Completed(32);
            return true;
        }
        return false ;
    }


    function Transportation_Goods_start (uint localTokens) internal returns (uint) {

        get("1356:appchain3:mychannel&Transportation_Goods","Transportation");
        uint reqId = workList.DefaultTask_start (this.Transportation_Goods_callback);
        active_Transportation_Goods |= uint(1) << reqId;
        return localTokens & uint(~16);
    }

    function Transportation_Goods_callback (uint reqId) public returns (bool) {
        if (active_Transportation_Goods == 0)
            return false;
        uint index = uint(1) << reqId;
        if(active_Transportation_Goods & index == index) {
            active_Transportation_Goods &= ~index;
            step (tokens | 32);
            emit Element_Execution_Completed(64);
            return true;
        }
        return false ;
    }


    function Raw_Material_Invoicing_start (uint localTokens) internal returns (uint) {

        get("1356:appchain1:mychannel&Raw_Material_Invoicing","RawMaterialInvoice");
        uint reqId = workList.DefaultTask_start (this.Raw_Material_Invoicing_callback);
        active_Raw_Material_Invoicing |= uint(1) << reqId;
        return localTokens & uint(~64);
    }

    function Raw_Material_Invoicing_callback (uint reqId) public returns (bool) {
        if (active_Raw_Material_Invoicing == 0)
            return false;
        uint index = uint(1) << reqId;
        if(active_Raw_Material_Invoicing & index == index) {
            active_Raw_Material_Invoicing &= ~index;
            step (tokens | 256);
            emit Element_Execution_Completed(128);
            return true;
        }
        return false ;
    }


    function Goods_Invoicing_start (uint localTokens) internal returns (uint) {

        get("1356:appchain2:mychannel&Goods_Invoicing","GoodsInvoice");
        uint reqId = workList.DefaultTask_start (this.Goods_Invoicing_callback);
        active_Goods_Invoicing |= uint(1) << reqId;
        return localTokens & uint(~128);
    }

    function Goods_Invoicing_callback (uint reqId) public returns (bool) {
        if (active_Goods_Invoicing == 0)
            return false;
        uint index = uint(1) << reqId;
        if(active_Goods_Invoicing & index == index) {
            active_Goods_Invoicing &= ~index;
            step (tokens | 1024);
            emit Element_Execution_Completed(256);
            return true;
        }
        return false ;
    }

    function step(uint localTokens) internal {
        bool done = false;
        while (!done) {
            if (localTokens & 512 == 512) {
                localTokens = Event_1exrr46(localTokens);
                continue;
            }
            if (localTokens & 32 == 32) {
                localTokens = localTokens & uint(~32) | 192;
                continue;
            }
            if (localTokens & 1280 == 1280) {
                localTokens = localTokens & uint(~1280) | 512;
                continue;
            }
            if (localTokens & 2 == 2) {
                localTokens = Purchas_Order_start(localTokens);
                continue;
            }
            if (localTokens & 4 == 4) {
                localTokens = Production_Raw_Material_start(localTokens);
                continue;
            }
            if (localTokens & 8 == 8) {
                localTokens = Production_Goods_start(localTokens);
                continue;
            }
            if (localTokens & 16 == 16) {
                localTokens = Transportation_Goods_start(localTokens);
                continue;
            }
            if (localTokens & 64 == 64) {
                localTokens = Raw_Material_Invoicing_start(localTokens);
                continue;
            }
            if (localTokens & 128 == 128) {
                localTokens = Goods_Invoicing_start(localTokens);
                continue;
            }
            done = true;
        }
        tokens = localTokens;
    }

    function getRunningFlowNodes() public returns (uint) {
        uint flowNodes = 0;
        uint localTokens = tokens;
        return flowNodes;
    }

    function getStartedFlowNodes() public returns (uint) {
        uint flowNodes = 0;
        uint localTokens = tokens;
        if(active_Purchas_Order != 0)
            flowNodes |= 8;
        if(active_Production_Raw_Material != 0)
            flowNodes |= 16;
        if(active_Production_Goods != 0)
            flowNodes |= 32;
        if(active_Transportation_Goods != 0)
            flowNodes |= 64;
        if(active_Raw_Material_Invoicing != 0)
            flowNodes |= 128;
        if(active_Goods_Invoicing != 0)
            flowNodes |= 256;

        return flowNodes;
    }

    function getWorkListAddress() public returns (address) {
        return workList.getAddress();
    }

    function getTaskRequestIndex(uint taskId) public returns (uint) {
        if (taskId == 8)
            return active_Purchas_Order;
        if (taskId == 16)
            return active_Production_Raw_Material;
        if (taskId == 32)
            return active_Production_Goods;
        if (taskId == 64)
            return active_Transportation_Goods;
        if (taskId == 128)
            return active_Raw_Material_Invoicing;
        if (taskId == 256)
            return active_Goods_Invoicing;
    }

            // contract for data exchange
    function getData(string memory key) public view returns(string memory) {
        return dataM[key];
    }

    function get(string memory destChainServiceID, string memory key) internal {
        bytes[] memory args = new bytes[](1);
        args[0] = abi.encodePacked(key);

        bytes[] memory argsCb = new bytes[](1);
        argsCb[0] = abi.encodePacked(key);

        Broker(BrokerAddr).emitInterchainEvent(destChainServiceID, "interchainGet", args, "interchainSet", argsCb, "", new bytes[](0), false);
    }

    function set(string memory key, string memory value) public {
        dataM[key] = value;
    }


    function interchainSet(bytes[] memory args) public onlyBroker {
        require(args.length == 2, "interchainSet args' length is not correct, expect 2");
        string memory key = string(args[0]);
        string memory value = string(args[1]);
        if(keccak256(abi.encodePacked(key)) == keccak256(abi.encodePacked("Raw_Material")))
            Raw_Material = value;
        if(keccak256(abi.encodePacked(key)) == keccak256(abi.encodePacked("Goods")))
            Goods = value;
        if(keccak256(abi.encodePacked(key)) == keccak256(abi.encodePacked("Transportation")))
            Transportation = value;
        if(keccak256(abi.encodePacked(key)) == keccak256(abi.encodePacked("RawMaterialInvoice")))
            RawMaterialInvoice = value;
        if(keccak256(abi.encodePacked(key)) == keccak256(abi.encodePacked("GoodsInvoice")))
            GoodsInvoice = value;

    }

}


    abstract contract Broker {
        function emitInterchainEvent(
            string memory destFullServiceID,
            string memory func,
            bytes[] memory args,
            string memory funcCb,
            bytes[] memory argsCb,
            string memory funcRb,
            bytes[] memory argsRb,
            bool isEncrypt) public virtual;

        function register() public virtual;
    }

contract Supply_Chain_WorkList {
    struct DefaultTask_Request {
        function (uint) external returns (bool) callback;
    }
    DefaultTask_Request [] DefaultTask_requests;

    function DefaultTask_start (function (uint) external returns (bool) callback) public returns (uint) {        
        uint index = DefaultTask_requests.length;
        DefaultTask_requests.push(DefaultTask_Request(callback));
        return index;
    }

    function DefaultTask_callback (uint reqId) public{
        DefaultTask_requests[reqId].callback(reqId);
    }

    function getAddress() public view returns (address) {
        return address(this);
    }
}