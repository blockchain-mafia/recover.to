import React, { Component, useCallback, useRef, useState } from 'react'
import styled from 'styled-components/macro'
import { Formik, Form, Field, ErrorMessage } from 'formik'
import QRCode from 'qrcode.react'
import Textarea from 'react-textarea-autosize'
import { BounceLoader } from 'react-spinners'
import ReactToPrint from 'react-to-print'
import {
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownDivider
} from 'styled-dropdown-component'
import Web3 from 'web3'

import { useDrizzle, useDrizzleState } from '../temp/drizzle-react-hooks'
import Button from '../components/button'
import ETHAmount from '../components/eth-amount'
import { useDataloader } from '../bootstrap/dataloader'
import { ReactComponent as Settings } from '../assets/images/settings.svg'

const Container = styled.div`
  font-family: Nunito;
  color: #444;
  margin: 0 126px;
  padding: 77px 104px;
  background: #fff;
  border-radius: 20px; 
  box-shadow: 0px 4px 50px rgba(0, 0, 0, 0.1);
`

const Title = styled.h2`
  font-family: Nunito;
  font-size: 40px;
  color: #14213d;
  padding-bottom: 20px;
`

const SubTitle = styled.h3`
  font-family: Nunito;
  font-size: 30px;
  color: #14213d;
  margin: 30px 0;
`

const Label = styled.div`
  margin-top: 24px;
  font-family: Roboto;
  font-style: normal;
  font-weight: 200;
  font-size: 16px;
  line-height: 19px;
  color: #5C5C5C;
`

const StyledField = styled(Field)`
  line-height: 50px;
  padding-left: 20px;
  margin: 20px 0 40px 0;
  width: 100%;
  display: block;
  background: #FFFFFF;
  border: 1px solid #CCCCCC;
  box-sizing: border-box;
  border-radius: 5px;
`

const StyledTextarea = styled(Textarea)`
  padding: 20px 0 0 20px;
  margin: 20px 0 40px 0;
  width: 100%;
  display: block;
  background: #FFFFFF;
  border: 1px solid #CCCCCC;
  box-sizing: border-box;
  border-radius: 5px;
`

const StyledForm = styled(Form)`
  display: flex;
  flex-direction: column;
`

const StyledPrint = styled.div`
  display: none;
  @media print {
    display: block;
    margin: 40px;
  }
`

const DropdownStyled = styled(Dropdown)`
  float: right;
  top: -10px;
`

const StyledSettings = styled(Settings)`
  &:hover {
    cursor: pointer;
  }
`

const DropdownMenuStyled = styled(DropdownMenu)`
  float: right;
  left: auto;
  right: 0;
`

const DropdownItemStyled = styled(DropdownItem)`
  line-height: 24px;
  &:hover {
    cursor: pointer;
  }
`

export default props => {
  const recover = JSON.parse(localStorage.getItem('recover') || '{}')
  const [dropdownHidden, setDropdownHidden] = useState(true)
  const { useCacheCall, useCacheSend } = useDrizzle()
  const drizzleState = useDrizzleState(drizzleState => ({	
    account: drizzleState.accounts[0]
  }))

  const { send: sendReimburse, status: statusReimburse } = useCacheSend('Recover', 'reimburse')
  const { send: sendPayArbitrationFeeByFinder, status: statusPayArbitrationFeeByFinder } = useCacheSend(
    'Recover',
    'payArbitrationFeeByFinder'
  )

  // TODO: add partial reimburse
  const reimburse = useCallback(({ itemID, amount }) => sendReimburse(itemID, amount))

  const [claimIDHex, privateKey] = props.claimID_Pk.split('-privateKey=')

  const claimID = claimIDHex.replace(/0+$/, '')

  // TODO: get the arbitratorExtraData
  // const arbitratorExtraData = useCacheCall('Recover', 'arbitratorExtraData')
  // const arbitrationCost = useCacheCall('Arbitrator', 'arbitrationCost', arbitratorExtraData)

  const loadDescription = useDataloader.getDescription()

  const claim = useCacheCall('Recover', 'claims', claimID) // FIXME: d it's claimID form url

  let item

  if(claim) {
    item = useCacheCall('Recover', 'items', claim.itemID)
    if(item) {
      item.content = {
        dataDecrypted: {type: 'loading...'}
      }

      const itemID = claim.itemID.replace(/0x0/gi, '0x').substring(0, 65)
      
      if(recover[itemID] && recover[itemID].privateKey) {
        const metaEvidence = loadDescription(
          item.descriptionEncryptedLink,
          recover[itemID].privateKey
        )
        if (metaEvidence) item.content = metaEvidence
      } else item.content = {
        dataDecrypted: {type: 'Data Encrypted'}
      }
      item.itemID = itemID
      if(recover[itemID] && recover[itemID].finder)
      item.finder = recover[itemID].finder
    }
  }

  return (
    <Container>
      {claim && item ? (
        <>
          {claim.finder === drizzleState.account && (
            <DropdownStyled>
              <StyledSettings 
                onClick={() => setDropdownHidden(!dropdownHidden)}
              />
              <DropdownMenuStyled hidden={dropdownHidden}>
                <DropdownItemStyled 
                  onClick={() => reimburse({ itemID: item.itemID, amount: item.rewardAmount})}
                >
                  Reimburse
                </DropdownItemStyled>
                <DropdownDivider />
                {/* TODO: call sendPayArbitrationFeeByFinder */}
                <DropdownItemStyled>Raise a Dispute (WIP)</DropdownItemStyled>
              </DropdownMenuStyled>
            </DropdownStyled>
          )}
          <Title>{item.content ? item.content.dataDecrypted.type : 'Item'}</Title>
          <Label>Description</Label>
          <div style={{padding: '10px 0'}}>{item.content ? item.content.dataDecrypted.description : '...'}</div>
          <Label>Contact Information</Label>
          <div style={{padding: '10px 0'}}>{item.content ? item.content.dataDecrypted.contactInformation : '...'}</div>
          <Label>Reward</Label>
          <div style={{padding: '10px 0'}}>{
              ETHAmount({amount: item.rewardAmount, decimals: 2})
            } ETH
          </div>
        </>
      ) : (
        <Title>Loading Item...</Title>
      )}
    </Container>
  )
}
