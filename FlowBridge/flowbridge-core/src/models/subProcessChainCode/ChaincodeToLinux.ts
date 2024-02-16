import { Client, ConnectConfig, SFTPWrapper } from 'ssh2';
import { exec } from 'child_process';
const sshCommand = 'ssh ubuntu@43.142.87.250';
import SftpClient from 'ssh2-sftp-client';

export const transferFileToLinux = (ContractName : any) => {
  return new Promise<void>((resolve, reject) => {
    const config: ConnectConfig = {
        host: '43.142.87.250',
        port: 22,
        username: 'ubuntu',
        password: 'Qwetuanzi@'
    };
    
    const localFilePath = `D:/桌面/技术型小论文/Caterpillar/v1.0/caterpillar-core/out/modelInfoTest/chaincode/${ContractName}.go`;
    const remoteFilePath = `/home/ubuntu/chaincode/src/${ContractName}/${ContractName}.go`;
    const client = new Client();

    //创建文件夹
    const command = `sudo mkdir /home/ubuntu/chaincode/src/${ContractName} && sudo chmod 777 /home/ubuntu/chaincode/src/${ContractName}`;

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
      client.on('ready', () => {
        client.sftp((err, sftp: SFTPWrapper) => {
          if (err) {
            console.error('Error creating SFTP client:', err);
            client.end();
            reject(err);
            return;
          }
  
          sftp.fastPut(localFilePath, remoteFilePath, {}, (err) => {
            if (err) {
              console.error('Error transferring file:', err);
              reject(err);
            } else {
              console.log('File transferred successfully!');
              resolve();
            }
  
            client.end();
          });
        });
      });
  
      client.on('error', (err) => {
        console.error('SSH connection failed:', err);
        reject(err);
      });
  
      client.connect(config);
    });

  });
};


export let Deploy_Chaincode = async (ContractName : any) => {

  // const command = 'sudo bash /home/ubuntu/Register_Contract_Script.sh'+ ' ' +ContractAddress;
  const command = `sudo bash /home/ubuntu/Deploy_Chaincode.sh ${ContractName}`;

  exec(`${sshCommand} "${command}"`, (error, stdout, stderr) => {
    if (error) {
      console.error(`执行命令时发生错误：${error.message}`);
      return;
    }
    if (stderr) {
      console.error(`命令运行产生了错误输出：${stderr}`);
      return;
    }
    console.log(`链码部署注册成功：${stdout}`);
  });
}