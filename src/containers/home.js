import React, { useState, useEffect, useCallback } from 'react'
import EthCrypto from 'eth-crypto'
import styled from 'styled-components/macro'

import { useDataloader } from '../bootstrap/dataloader'
import { useDrizzle, useDrizzleState } from '../temp/drizzle-react-hooks'
import CardItem from '../components/card-item'

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-gap: 70px;
  grid-auto-rows: 290px;
`

export default () => {
  const recover = JSON.parse(localStorage.getItem('recover') || '{}')

  const loadDescription = useDataloader.getDescription()

  const { useCacheCall } = useDrizzle()
  const drizzleState = useDrizzleState(drizzleState => ({	
    account: drizzleState.accounts[0],	
  }))

  const itemIDs = useCacheCall('Recover', 'getItemIDsByOwner', drizzleState.account)

  const items = useCacheCall(['Recover'], call =>
    itemIDs
      ? itemIDs.reduce(
          (acc, d) => {
            const item = call('Recover', 'items', d)
            if(item) {
              const itemID = d.replace(/0x0/gi, '0x').substring(0, 65)
              item.content = {
                dataDecrypted: {type: 'loading...'}
              }
              if(recover[itemID] && recover[itemID].privateKey) {
                const metaEvidence = loadDescription(
                  item.descriptionEncryptedLink,
                  recover[itemID].privateKey
                )
                if (metaEvidence) item.content = metaEvidence
              } else item.content = {
                dataDecrypted: {type: 'Data Encrypted'}
              }
              item.ID = itemID
              acc.data.push(item)
            }
            return acc
          },
          {
            data: [],
            loading: false
          }
        )
      : { loading: true }
  )

  return (
    <Grid>
      <CardItem newItem={true} />
      {
        !items.loading && items.data.reverse().map(item => (
          <CardItem 
            key={item.ID}
            encrypted={false}
            onClick={
              () => window.location.replace(
                `/contract/${
                  process.env.REACT_APP_RECOVER_KOVAN_ADDRESS
                }/items/${item.ID}-privateKey=${recover[item.ID] ? recover[item.ID].privateKey : ''}`
              )
            }
          >
            <p>{item.content && item.content.dataDecrypted.type}</p>
            <p>{item.content && item.content.dataDecrypted.description}</p>
          </CardItem>
        ))
      }
    </Grid>
  )
}
