var ERC20 = artifacts.require("./Token/ERC20.sol")
var Vesting = artifacts.require("./Token/Vesting.sol")

var Chalk = require('chalk')
var Fs = require('fs')
var Path = require('path')
var CsvToJson = require('csvtojson')
var fetch = require('fetch').fetchUrl
// var bigInt = require('bit-ingeger')


module.exports = async function(deployer, network, accounts) {

//   deployer.networks.local.gasPrice = fetchGasPrice('normal')
//   console.log(deployer.networks.local.gasPrice)


  const name = "Splyt SHOPX tokens"
  const symbol = "SHOPX"

  let walletConfig = {}

  if(network === 'staging') {
    walletConfig = { from: "0xd9e5e4bde24faa2b277ab2be78c95b9ae24259a8" }
  } else {                                                      
    walletConfig = { from: accounts[0] }
  }

  console.log(Chalk.green('Deploy wallet address: ' + walletConfig.from))

  const aMonth = 2629743
  const logFilePath = InitLogFile()

  // Load csv file
  const csvFilePath = Path.resolve('./DistributionList_Ropsten.csv')
  const csvData = await CsvToJson().fromFile(csvFilePath)
  Log("CSV imported with " + csvData.length + " rows")

  var erc20 = await deployer.deploy(ERC20, name, symbol, walletConfig)

  Log('ERC20 Deployed')
  Log('TxHash: ' + erc20.transactionHash)
  Log('ContractAddress: ' + erc20.address)

  // deploy vestings
  for(var vestingData of csvData) {
    Log("------------")
    Log("Deploying Vesting: ")
    Log("BeneficiaryAddress: " + vestingData.BeneficiaryAddress)
    Log("StartDate: " + vestingData.StartDate)
    Log("CliffDurationMonth: " + vestingData.CliffDurationMonth)
    Log('DurationMonth: ' + vestingData.DurationMonth)
    Log("Revocable: " + vestingData.Revocable)
    Log("FirstMonthBonusPercent: " + vestingData.FirstMonthBonusPercent)

    // skip over non vested contracts
    if(vestingData.UsesVesting == 'FALSE'){
      Log("Vesting false skipping")
      continue
    }

    // in seconds
    var start = Math.round(new Date(vestingData.StartDate).getTime()/1000)
    var cliffDuration = vestingData.CliffDurationMonth * aMonth
    var duration = Math.round(vestingData.DurationMonth * aMonth + cliffDuration)
    var totalAmount = BigInt(vestingData.TotalTokens * 1000000000000000000)

    // deploy vesting contract
    var vesting = await deployer.deploy(Vesting,
      vestingData.BeneficiaryAddress,
      start,
      cliffDuration,
      duration,
      vestingData.Revocable,
      '0x36E30BB8cD97e363F5e251983c8fFF1eC7A06f3a',
      vestingData.FirstMonthBonusPercent,
      walletConfig)

    Log('Vesting Deployed')
    Log('TxHash: ' + vesting.transactionHash)
    Log('ContractAddress: ' + vesting.address)

    //mint to vesting contract
    await erc20._mint(vesting.address, totalAmount, walletConfig)
    .then(async (tx) => {
      Log('Minted to vesting contract ' + vesting.address +  ' Tokens ' + totalAmount)
      await erc20.balanceOf(vesting.address, walletConfig)
      .then(balance => {
        Log(vestingData.Name + '\'s Vesting Contract: ' + vesting.address + ' has balance of ' + balance)
      })
    })

  }//end forloop

  function InitLogFile() {

    const folderPath = Path.resolve('./logs')
    if (!Fs.existsSync(folderPath))
      fs.mkdirSync(folderPath, {recursive: true})
    const now = new Date()
    const filePath = folderPath + '/' + now.getUTCFullYear() + ':' + now.getUTCMonth() + ':' + now.getUTCDate() + '_' + network
    Fs.appendFileSync(filePath, '\n\n' + LogPrefix() + '-------------------------\n');
    return filePath
  }

  function Log(message) {
    if(message.includes("err")) {
      console.log(Chalk.red(LogPrefix() + ' ' + message))
    } else {
      console.log(Chalk.green(LogPrefix() + ' ' + message))
    }
    Fs.appendFileSync(logFilePath, LogPrefix() + ' ' + message + '\n');
  }

  function LogPrefix() {
    const now = new Date()
    return now.getUTCHours() + ':' + now.getUTCMinutes() + ':' + now.getUTCSeconds()
  }

  function fetchGasPrice(speed) {
    fetch('https://api.etherscan.io/api?module=gastracker&action=gasoracle&apikey=HB19QTI959UAFKGDZ6NPXQJVHCGU9REU1K', {
      method: 'GET',
      headers: {}
    }, (err, meta, body) => {
      // returning dollar amount moved 4 decimal places so intead of $86.5920xx... it'll be $865920.xx...
      // etherPrice = JSON.parse(body.toString()).data[1027].quote.USD.price * 10000

      var response = JSON.parse(body.toString())
      console.log(response.result.SafeGasPrice)
      return response.result.SafeGasPrice
    })
  }
}