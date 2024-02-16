var fs = require('fs');
var readline = require('readline');
var path = require('path');
var out_root = path.join(__dirname, '../../../out/');
var template_root = path.join(__dirname, '../../../templates/');


// Helper function to check dir and mkdir
function checkPath(unique_id) {
    if (!fs.existsSync(out_root)) {
        fs.mkdirSync(out_root);
    }
    if (!fs.existsSync(out_root+unique_id)) {
        fs.mkdirSync(out_root+unique_id);
    }
    if (!fs.existsSync(out_root+unique_id+'/chaincode/')) {
        fs.mkdirSync(out_root+unique_id+'/chaincode/');
    }
}


// Main function to generate chaincode go file
export function generateGo(unique_id, tasks , subProcessName) {
    //console.log('---begin generating Go chaincode---');
    
    checkPath(unique_id);
    var outpath = out_root+unique_id+'/chaincode/' + subProcessName+'.go';
    fs.writeFileSync(outpath, "");

    var domain = unique_id + '.com';

    // Write header
    var header_template = fs.readFileSync(template_root+'chaincode_header.go', 'utf8');
    header_template.split(/\r?\n/).forEach(function(line){
            fs.appendFileSync(outpath,eval('`'+line+'\n`'));
        });

    // Write all elements(Tasks)
    var event_setup_template = fs.readFileSync(template_root+'chaincode_event_setup.go', 'utf8');
    for (var i=0; i<tasks.length; i++) {
        var task = tasks[i]
        var Type = '"'+task.Type+'"';
        var ID = '"'+task.ID+'"';
        var Name = '"'+task.Name+'"';
        var Token = 0;
        var AND_token = '';
        if (Type=='"AND"') {
            AND_token = '"'+task.Parents.join('":0,"')+'":0';
        }
        var Children = '';
        if (task.Children!=null && task.Children.length>0) {
            Children = '"'+task.Children.join('","')+'"';
        }
        var Lane = '"'+task.Lane+'.'+domain+'"'
        var start_event_control = '';
        var function_control = '';
        if (Type=='"START"') {
            start_event_control = 'StartIDs = append(StartIDs, event.ID)\n';
        } else if (Type=='"task"') {
            function_control = 'Functions[event.Name]=event.ID';
        }
        event_setup_template.split(/\r?\n/).forEach(function(line){
            fs.appendFileSync(outpath,eval('`'+line+'\n`'));
        });
    }

    // Write remaining body part
    var body_template = fs.readFileSync(template_root+'chaincode_body.go', 'utf8');
    body_template.split(/\r?\n/).forEach(function(line){
            fs.appendFileSync(outpath,eval('`'+line+'\n`'));
        });

    //console.log('---end generating Go chaincode---');
}

module.exports = generateGo;