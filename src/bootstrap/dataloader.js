import { useEffect, useRef, useState } from 'react'
import Dataloader from 'dataloader'
import EthCrypto from 'eth-crypto'
import archon from './archon'

const funcs = {
  getEvidence: (contractAddress, arbitratorAddress, disputeID, options) =>
    archon.arbitrable
      .getDispute(contractAddress, arbitratorAddress, disputeID, {
        strictHashes: true,
        ...options
      })
      .then(d =>
        archon.arbitrable.getEvidence(
          contractAddress,
          arbitratorAddress,
          d.evidenceGroupID,
          {
            strictHashes: true,
            ...options
          }
        )
      )
      .catch(() => null),
  getMetaEvidence: (contractAddress, arbitratorAddress, disputeID, options) =>
    archon.arbitrable
      .getDispute(contractAddress, arbitratorAddress, disputeID, {
        strictHashes: true,
        ...options
      })
      .then(d =>
        archon.arbitrable.getMetaEvidence(contractAddress, d.metaEvidenceID, {
          strictHashes: true,
          ...options
        })
      )
      .catch(() => null),
  load: (URI, options) =>
    archon.utils
      .validateFileFromURI(URI, {
        strictHashes: true,
        ...options
      })
      .then(res => res.file)
      .catch(() => null),
  getDescription: (descriptionEncryptedLink, privateKey) =>
    fetch(`https://ipfs.kleros.io/${descriptionEncryptedLink}`)
      .then(res => res.json())
      .then(async data => {
        const dataDecrypted = await EthCrypto.decryptWithPrivateKey(
          privateKey,
          EthCrypto.cipher.parse(data.dataEncrypted)
        )
        return {...data, dataDecrypted: JSON.parse(dataDecrypted)}
      })
      .catch(() => null)
}
export const dataloaders = Object.keys(funcs).reduce((acc, f) => {
  acc[f] = new Dataloader(
    argsArr => Promise.all(argsArr.map(args => funcs[f](...args))),
    { cacheKeyFn: JSON.stringify }
  )
  return acc
}, {})

export const useDataloader = Object.keys(dataloaders).reduce((acc, f) => {
  acc[f] = () => {
    const [state, setState] = useState({})
    const loadedRef = useRef({})
    let mounted = true
    useEffect(() => () => (mounted = false))
    return (...args) => {
      const key = JSON.stringify(args)
      return loadedRef.current[key]
        ? state[key]
        : dataloaders[f].load(args).then(res => {
            if (mounted) {
              loadedRef.current[key] = true
              setState(state => ({ ...state, [key]: res }))
            }
          }) && undefined
    }
  }
  return acc
}, {})
