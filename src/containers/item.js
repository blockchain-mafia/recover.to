import React, { useState, useCallback } from 'react'
import EthCrypto from 'eth-crypto'
import styled from 'styled-components/macro'
import { Formik, Form, Field, ErrorMessage } from 'formik'
import QRCode from 'qrcode.react'
import Textarea from 'react-textarea-autosize'
import { BounceLoader } from 'react-spinners'

import { useDrizzle, useDrizzleState } from '../temp/drizzle-react-hooks'
import { version } from '../../package.json'
import Button from '../components/button'
import ETHAmount from '../components/eth-amount'

import ipfsPublish from './api/ipfs-publish'

const StyledDiv = styled.div`
  max-width: 90%;
`
export default props => {
  const [urlDescriptionEncrypted, setUrlDescriptionEncrypted] = useState()
  const { drizzle, useCacheCall, useCacheSend } = useDrizzle()

  const { send: sendClaim, status: statusClaim } = useCacheSend(
    'Recover',
    'claim'
  )
  const { send: sendAcceptClaim, status: statusAcceptClaim } = useCacheSend(
    'Recover',
    'acceptClaim'
  )
  const { send: sendPay, status: statusPay } = useCacheSend('Recover', 'pay')

  const [itemID, privateKey] = props.itemID_Pk.split('-privateKey=')

  // use api infura
  const claim = useCallback(({ finder, descriptionLink }) => {
    if(itemID && finder && descriptionLink)
        sendClaim(itemID, finder, descriptionLink)
  })

  const descriptionLinkContentFn = useCallback(() =>
    fetch(`https://ipfs.kleros.io/${item.descriptionEncryptedLink}`)
      .then(async res => EthCrypto.cipher.parse(await res.text()))
      .then(
        async data =>
          await EthCrypto.decryptWithPrivateKey(privateKey, data)
      )
      .then(dataDecrypt => setUrlDescriptionEncrypted(dataDecrypt))
  )

  const item = useCacheCall('Recover', 'items', itemID)

  const claimIDs = useCacheCall('Recover', 'getClaimsByItemID', itemID)

  let claims = []

  if (item !== undefined && item.descriptionEncryptedLink !== undefined)
    descriptionLinkContentFn()

  if (claimIDs && claimIDs.length > 0)
    claimIDs.map(claimID => {
      const claim = useCacheCall('Recover', 'claims', claimID)
      claims.push({ ...claim, ID: claimID })
    })

  return (
    <>
      <h1>My item</h1>
      {item ? (
        <>
          <div>Owner: {item.owner}</div>
          <div>addressForEncryption: {item.addressForEncryption}</div>
          <div>descriptionEncryptedLink: {item.descriptionEncryptedLink}</div>
          <div>type: {JSON.parse(urlDescriptionEncrypted || '{"type": ""}').type}</div>
          <div>description: {JSON.parse(urlDescriptionEncrypted || '{"description": ""}').description}</div>
          <div>contact information: {JSON.parse(urlDescriptionEncrypted || '{"contactInformation": ""}').contactInformation}</div>
          <div>amountLocked: {item.amountLocked}</div>
          <div>rewardAmount: {item.rewardAmount}</div>
          <div>timeoutLocked: {item.timeoutLocked}</div>
          <div>claims: {item.claimIDs}</div>
          <div>Private Key: {privateKey}</div>
          <h2>
            Link:{' '}
            {`https://app.recover.to/contract/${
              process.env.REACT_APP_RECOVER_KOVAN_ADDRESS
            }/contract/${props.contract}/items/${props.itemID_Pk}`}
          </h2>
          <h2>Qr code</h2>
          <QRCode
            value={`https://app.recover.to/contract/${props.contract}/items/${
              props.itemID_Pk
            }`}
          />
        </>
      ) : (
        <p>Loading item...</p>
      )}

      <h2>Claim this item</h2>
      <Formik
        initialValues={{
          finder: '',
          descriptionLink: ''
        }}
        validate={values => {
          let errors = {}
          if (!drizzle.web3.utils.isAddress(values.finder))
            errors.finder = 'Valid Address Required'
          if (values.descriptionLink.length > 1000000)
            errors.descriptionLink =
              'The maximum numbers of the characters for the description is 1,000,000 characters.'

          return errors
        }}
        onSubmit={claim}
      >
        {({ errors, values, handleChange }) => (
          <>
            <Form>
              <div>
                <label htmlFor="finder" className="">
                  Finder Address
                </label>
                <Field
                  name="finder"
                  className=""
                  placeholder="Finder Address"
                />
              </div>
              <div>
                <label htmlFor="descriptionLink" className="">
                  Description
                </label>
                <Field
                  name="description"
                  value={values.descriptionLink}
                  render={({ field, form }) => (
                    <Textarea
                      {...field}
                      className=""
                      minRows={10}
                      onChange={e => {
                        handleChange(e)
                        form.setFieldValue('descriptionLink', e.target.value)
                      }}
                    />
                  )}
                />
                <ErrorMessage
                  name="descriptionLink"
                  component="div"
                  className=""
                />
              </div>
              <div className="">
                <Button
                  type="submit"
                  onClick={claim}
                  disabled={Object.entries(errors).length > 0}
                >
                  Claim
                </Button>
              </div>
            </Form>
            {statusClaim && statusClaim == 'pending' && (
              <p><BounceLoader color={'#12D8FA'} size={30} style={{display: 'inline'}}/> {' '}Transaction pending</p>
            )}
            {statusClaim && statusClaim !== 'pending' && (
              <>
                <p>Transaction ongoing</p>
                {statusClaim === 'success'
                  ? 'Claim Saved'
                  : 'Error during the transaction.'}
              </>
            )}
          </>
        )}
      </Formik>

      <h2>List Claims</h2>

      {claims &&
        claims.map((claim, index) => (
          <div key={index}>
            <p>ID: {claim && claim.ID}</p>
            <p>Finder: {claim && claim.finder}</p>
            <p>Description: {claim && claim.descriptionLink}</p>

            {claim && item && item.rewardAmount && (
              <button
                onClick={() =>
                  sendAcceptClaim(itemID, claim.ID, {
                    value: item.rewardAmount
                  })
                }
              >
                Accept Claim
              </button>
            )}

            {claim && item && item.amountLocked > 0 && (
              <button onClick={() => sendPay(itemID, item.amountLocked)}>
                Pay the finder
              </button>
            )}
          </div>
        ))}

      <p>Version: {version}</p>
    </>
  )
}
