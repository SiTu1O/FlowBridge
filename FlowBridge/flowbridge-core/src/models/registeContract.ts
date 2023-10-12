import { exec } from 'child_process';

const sshCommand = 'ssh ubuntu@43.142.87.250';

export let Register_Function = async (ContractAddress : any) => {

    // const command = 'sudo bash /home/ubuntu/Register_Contract_Script.sh'+ ' ' +ContractAddress;
    const command = `sudo bash /home/ubuntu/Register_Contract_Script.sh ${ContractAddress}`;

    exec(`${sshCommand} "${command}"`, (error, stdout, stderr) => {
      if (error) {
        console.error(`执行命令时发生错误：${error.message}`);
        return;
      }
      if (stderr) {
        console.error(`命令运行产生了错误输出：${stderr}`);
        return;
      }
      console.log(`命令运行成功，输出：${stdout}`);
    });
}

// import { exec } from 'child_process';

// const sshCommand = 'ssh ubuntu@43.142.87.250';

// export let Register_Function = async (ContractAddress: any) => {
//   const command = `sudo bash -c "bash /home/ubuntu/Register_Contract_Script.sh ${ContractAddress}"`;

//   exec(`${sshCommand} "${command}"`, (error, stdout, stderr) => {
//     if (error) {
//       console.error(`执行命令时发生错误：${error.message}`);
//       return;
//     }
//     if (stderr) {
//       console.error(`命令运行产生了错误输出：${stderr}`);
//       return;
//     }
//     console.log(`命令运行成功，输出：${stdout}`);
//   });
// };