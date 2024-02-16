import { Deploy_Chaincode, transferFileToLinux } from "./ChaincodeToLinux";

var fs = require('fs');
var path = require('path');
var out_root = path.join(__dirname, '../../../out/');
var et = require('elementtree');   //这个模块用于读取xml数据
var HashSet = require('hashset');
var generateGo = require('./ChaincodeGenerator'); //生成chaincode


// Helper structure for an object in BPMN (event, task, gateway)
function Task(id,type,name,children,parents) {
    this.ID = id;
    this.Name = name;
    this.Type = type;
    // this.Lane = lane;
    if(children)
        this.Children = children;
    else
        this.Children = [];
    if(parents)
        this.Parents = parents;
    else
        this.Parents = []; 
}


// 这个函数解析BPMN的XML格式的数据
function getElementTree(data){
    // 这两个变量没用到
    var XML = et.XML;
    var ElementTree = et.ElementTree;

    // The input bpmn file
    return et.parse(data);
}

// Helper function to get flows in the tree 
//解析etree的数据
/**
ElementTree {
  _root: Element {
    _id: 0,
    tag: 'bpmn:definitions',
    attrib: {
      'xmlns:xsi': 'http://www.w3.org/2001/XMLSchema-instance',
    },
    text: '\n  ',
    tail: null,
    _children: [ [Element], [Element], [Element] ]
  }
}
 */
function getFlows(etree){
    return etree.findall('./bpmn:process/bpmn:subProcess/bpmn:sequenceFlow');
    //<bpmn:sequenceFlow id="SequenceFlow_10oocws" sourceRef="ExclusiveGateway_1taz9js" targetRef="EndEvent_0uzt90q" />
}


// Helper function to get mappings from id to type and id to name
// And insert function names into a hashset to check duplicates
//把id，name，type的信息保存到对象或者hashmap里
function getNameAndTypeMappings(etree,typeMap,nameMap,functionNames){

    var tasks = [];
    var normalTasks = etree.findall('./bpmn:process/bpmn:subProcess/bpmn:task');
    var sendTasks = etree.findall('./bpmn:process/bpmn:subProcess/bpmn:sendTask');
    var receiveTasks = etree.findall('./bpmn:process/bpmn:subProcess/bpmn:receiveTask');
    var userTasks = etree.findall('./bpmn:process/bpmn:subProcess/bpmn:userTask');
    var manualTasks = etree.findall('./bpmn:process/bpmn:subProcess/bpmn:manualTask');
    var businessRuleTasks = etree.findall('./bpmn:process/bpmn:subProcess/bpmn:businessRuleTask');
    var scriptTasks = etree.findall('./bpmn:process/bpmn:subProcess/bpmn:scriptTask');
    var serviceTasks = etree.findall('./bpmn:process/bpmn:subProcess/bpmn:serviceTask');
    
    tasks = tasks.concat(normalTasks);
    tasks = tasks.concat(sendTasks);
    tasks = tasks.concat(receiveTasks);
    tasks = tasks.concat(userTasks);
    tasks = tasks.concat(manualTasks);
    tasks = tasks.concat(businessRuleTasks);
    tasks = tasks.concat(scriptTasks);  
    tasks = tasks.concat(serviceTasks);

    // Check here if taskname is unique
    for(var iter=0; iter<tasks.length; iter++){
        typeMap[tasks[iter].get('id')] = 'task';
        if(functionNames.contains(tasks[iter].get('name'))){
            return "Duplicated function name detected: "+tasks[iter].get('name');
        }
        else{
            nameMap[tasks[iter].get('id')] = tasks[iter].get('name');
            functionNames.add(tasks[iter].get('name'));
        }
    }

    var starts = etree.findall('./bpmn:process/bpmn:subProcess/bpmn:startEvent');
    for(var iter=0; iter<starts.length; iter++){
        typeMap[starts[iter].get('id')] = 'START';
        nameMap[starts[iter].get('id')] = starts[iter].get('name');
    }

    var events = etree.findall('./bpmn:process/bpmn:subProcess/bpmn:intermediateThrowEvent');
    for(var iter=0; iter<events.length; iter++){
        typeMap[events[iter].get('id')] = 'event';
        nameMap[events[iter].get('id')] = events[iter].get('name');            
    }

    var xors = etree.findall('./bpmn:process/bpmn:subProcess/bpmn:exclusiveGateway');
    for(var iter=0; iter<xors.length; iter++){
        typeMap[xors[iter].get('id')] = 'XOR';
        nameMap[xors[iter].get('id')] = xors[iter].get('name');            
    }

    var ands = etree.findall('./bpmn:process/bpmn:subProcess/bpmn:parallelGateway');
    for(var iter=0; iter<ands.length; iter++){
        typeMap[ands[iter].get('id')] = 'AND';
        nameMap[ands[iter].get('id')] = ands[iter].get('name');            
    }

    // Inclusive Gateway feature is turned off
    var ors = etree.findall('./bpmn:process/bpmn:subProcess/bpmn:inclusiveGateway');
    if (ors.length>0) {
        return "Support for Inclusive Gateway is not enabled.";
    }


    var ends = etree.findall('./bpmn:process/bpmn:subProcess/bpmn:endEvent');
    for(var iter=0; iter<ends.length; iter++){
        typeMap[ends[iter].get('id')] = 'END';
        nameMap[ends[iter].get('id')] = ends[iter].get('name');            
    }
    return null;
}


// Helper function to get mappings from id to list of incoming/ougoing ids
// And insert XOR condition name to the function name hashset and check for duplicates
function getDependancies(flows,incomingMap,outgoingMap,typeMap,nameMap,functionNames){
    // store immediate dependants
    for(var iter=0; iter<flows.length; iter++){
        //console.log( flows[iter].get('name') +" && " + typeMap[flows[iter].get('sourceRef')]);
        // XOR with condition specified -> transform condition to a task for flow control
        if(typeMap[flows[iter].get('sourceRef')] == 'XOR' && flows[iter].get('name') != null){
                //annotation exists
                var newid = 'Condition_'+flows[iter].get('id').toString().substring(13);//re-use sequence flow id, 13 is length of 'SequenceFlow_'
                typeMap[newid] = 'task';
                if(functionNames.contains(flows[iter].get('name'))){
                    return "Duplicated function name detected: "+flows[iter].get('name');
                }
                functionNames.add(flows[iter].get('name'));
                nameMap[newid] = flows[iter].get('name');
                // Owner of the XOR gate decides the path
                // laneMap[newid] = laneMap[flows[iter].get('sourceRef')];

                insert(incomingMap, newid,flows[iter].get('sourceRef'));
                insert(outgoingMap, flows[iter].get('sourceRef'),newid);
                insert(incomingMap, flows[iter].get('targetRef'),newid);
                insert(outgoingMap, newid,flows[iter].get('targetRef'));
        } else{
            insert(incomingMap, flows[iter].get('targetRef'),flows[iter].get('sourceRef'));
            insert(outgoingMap, flows[iter].get('sourceRef'),flows[iter].get('targetRef'));
        }
    }
    // Check nested XOR gate
    for (var source in outgoingMap){
        if (typeMap[source] == 'XOR' && outgoingMap[source].length > 1) {
            for (var iter=0; iter<outgoingMap[source].length; iter++) {
                var target = outgoingMap[source][iter];
                if (typeMap[target] == 'XOR' || typeMap[target] == 'AND') {
                    return "Immediate nested exclusive gateways is not supported. From "+source+" To "+target;
                }
            }
        }
    }
    return null;
}


// Helper function for value insertion with key check
function insert(dep, key, value) {
    if(!dep[key])
        dep[key] = [];
    dep[key].push(value);
}


// Helper function to put all maps together using Task structure
// Return the array of Tasks
function formArray(typeMap,nameMap,incomingMap,outgoingMap){
    var array = [];
    for (var ids in typeMap){
        array.push(new Task(ids,typeMap[ids],nameMap[ids],outgoingMap[ids],incomingMap[ids]));
    }
    return array;
}


// Main function of Translator module
// Returns {errors: list of any error messages, num_peers: int to be saved in database, chaincode: as string}
export function parse(data,unique_id){
    //把BPMN的xml数据转换成对象的格式
    var etree = getElementTree(data);
    
    //sequence
    //得到flow连接线的信息
    var flows = getFlows(etree);

    
    //task name and type
    //保存每个任务节点的id，name，和type，其中id是索引
    var nameMap = {};
    var typeMap = {};
    var functionNames = new HashSet();
    var err = null;
    err = getNameAndTypeMappings(etree,typeMap,nameMap,functionNames);
    if (err) return {errors: [err.toString()], num_peers: 0, chaincode: null};

    //task flow
    //记录输入输出的节点
    var incomingMap = {};
    var outgoingMap = {};    
    err = getDependancies(flows,incomingMap,outgoingMap,typeMap,nameMap,functionNames);
    if (err) return {errors: [err.toString()], num_peers: 0, chaincode: null};

    //最终，把BPMN的信息转换成Task对象
    var taskObjArray = formArray(typeMap,nameMap,incomingMap,outgoingMap);
    
    var subProcess = etree.findall('./bpmn:process/bpmn:subProcess');
    var subProcessName = subProcess[0].get('name')

    try {generateGo(unique_id, taskObjArray,subProcessName);}
    catch (err) {return {errors: [err.toString()], chaincode: null};}

    var gofile = out_root + unique_id + "/chaincode/" +subProcessName +".go";
    var chaincode = fs.readFileSync(gofile,'utf-8');

    // 调用示例
    transferFileToLinux(subProcessName)
    .then(() => {
        console.log('文件传输成功！');
        Deploy_Chaincode(subProcessName);
    })
    .catch((error) => {
        console.error('文件传输失败:', error);
    });

    return {errors: null, chaincode: chaincode};
}

module.exports = {parse:parse};

