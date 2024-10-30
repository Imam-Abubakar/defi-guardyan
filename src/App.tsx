import React, { useState } from "react";
import axios from "axios";
import { fetchTokenBalances } from "./utils/fetchTokenBalances";

const App = () => {
  const [address, setAddress] = useState<string>("");
  const [collateral, setCollateral] = useState<number>(0);
  const [debt, setDebt] = useState<number>(0);
  const [healthFactor, setHealthFactor] = useState<number>(0);
  const [riskLevel, setRiskLevel] = useState<string>("LOW");
  const [liquidationPrice, setLiquidationPrice] = useState<number>(0);

  // Fetch Position Data
  const fetchPosition = async () => {
    const walletAddress = address;
    if (!walletAddress) return;

    try {
      const tokenBalances = await fetchTokenBalances(walletAddress);

      // Fetch all token prices at once
      const { data: tokenPrices } = await axios.get(
        "https://api.coinpaprika.com/v1/tickers/"
      );

      let totalCollateralValue = 0;
      let totalDebtValue = 0;

      // Map through each token in the wallet and find its value
      for (const token of tokenBalances) {
        const tokenData = tokenPrices.find(
          (priceData: any) => priceData.symbol === token.symbol
        );

        if (tokenData) {
          const tokenPrice = tokenData.quotes.USD.price;
          const tokenValue = token.balance * tokenPrice;

          // Assuming stablecoins are considered debt
          if (
            token.symbol === "USDC" ||
            token.symbol === "USDT" ||
            token.symbol === "DAI"
          ) {
            totalDebtValue += tokenValue;
          } else {
            totalCollateralValue += tokenValue;
          }
        }
      }

      setCollateral(totalCollateralValue);
      setDebt(totalDebtValue);
      calculateMetrics(totalCollateralValue, totalDebtValue);
    } catch (error) {
      console.error("Error fetching position data", error);
    }
  };

  // Calculate health factor, risk level, and liquidation price
  const calculateMetrics = (collateralValue: number, debtValue: number) => {
    const factor = debtValue > 0 ? collateralValue / debtValue : 0;
    setHealthFactor(factor);

    if (factor >= 2) setRiskLevel("LOW");
    else if (factor >= 1.5) setRiskLevel("MEDIUM");
    else setRiskLevel("HIGH");

    setLiquidationPrice(debtValue > 0 ? debtValue / collateralValue : 0);
  };

  return (
    <div className="flex flex-col items-center justify-center bg-gray-100 p-4">
      <h1 className="text-2xl font-bold mb-4">DeFi Guardyan</h1>
      <div className="w-full bg-white p-4 rounded shadow">
        <div className="flex mb-4">
        <button
            className="bg-black text-white px-4 py-2 rounded ml-2"
          >
            Connect Wallet
          </button>
          <input
            type="text"
            placeholder="Enter wallet address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="flex-1 ml-2 p-2 border rounded"
          />
          <button
            onClick={fetchPosition}
            className="bg-black text-white px-4 py-2 rounded ml-2"
          >
            Check
          </button>
        </div>

        {/* Position Display */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="p-4 bg-gray-100 rounded">
            <p className="text-sm font-semibold">Collateral</p>
            <p>${collateral.toFixed(2)}</p>
          </div>
          <div className="p-4 bg-gray-100 rounded">
            <p className="text-sm font-semibold">Debt</p>
            <p>${debt.toFixed(2)}</p>
          </div>
        </div>

        {/* Health Factor */}
        <div className="p-4 bg-gray-100 rounded mb-4">
          <p className="text-sm font-semibold">Health Factor</p>
          <p>{healthFactor.toFixed(2)}</p>
        </div>

        {/* Risk Analysis */}
        <div className="p-4 bg-gray-100 rounded">
          <p className="text-sm font-semibold">Risk Level</p>
          <p>{riskLevel}</p>
          <p>Liquidation Price: ${liquidationPrice.toFixed(2)}</p>
        </div>
      </div>
    </div>
  );
};

export default App;
