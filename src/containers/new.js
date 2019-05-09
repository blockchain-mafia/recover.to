import React, { useState, useCallback } from 'react'
import EthCrypto from 'eth-crypto'
import styled from 'styled-components/macro'
import { Formik, Form, Field, ErrorMessage } from 'formik'
import Textarea from 'react-textarea-autosize'
import { BounceLoader } from 'react-spinners'

import { useDrizzle, useDrizzleState } from '../temp/drizzle-react-hooks'
import { version } from '../../package.json'
import Button from '../components/button'

import ipfsPublish from './api/ipfs-publish'

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
  margin-botton: 30px;
  padding-bottom: 50px;
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

export default () => {
  const [identity] = useState(EthCrypto.createIdentity())
  const [isMetaEvidencePublish, setIsMetaEvidencePublish] = useState(false)
  const { drizzle, useCacheSend } = useDrizzle()
  const drizzleState = useDrizzleState(drizzleState => ({	
    account: drizzleState.accounts[0],	
  }))

  const { send, status } = useCacheSend('Recover', 'addItem')
  
  const addItem = useCallback(
    ({
      itemID,
      addressForEncryption,
      descriptionEncryptedIpfsUrl,
      rewardAmount,
      timeoutLocked
    }) =>
      send(
        itemID,
        addressForEncryption,
        descriptionEncryptedIpfsUrl,
        drizzle.web3.utils.toWei(rewardAmount, 'ether'),
        Number(timeoutLocked)
      )
  )

  return (
    <Container>
      <Title>New Item</Title>
      <Formik
        initialValues={{
          type: '',
          contactInformation: '',
          description: '',
          rewardAmount: 0,
          timeoutLocked: 604800 // Locked for one week
        }}
        validate={values => {
          let errors = {}
          if (values.type  === '')
            errors.type = 'Type Required'
          if (values.description.length > 100000)
            errors.description =
              'The maximum numbers of the characters for the description is 100,000 characters.'
          if (values.description.length > 100000)
            errors.description =
              'The maximum numbers of the characters for the description is 100,000 characters.'
          if (!values.rewardAmount)
            errors.rewardAmount = 'Amount reward required'
          if (isNaN(values.rewardAmount))
            errors.rewardAmount = 'Number Required'
          if (values.rewardAmount <= 0)
            errors.rewardAmount = 'Amount required must be positive.'
          if (!values.timeoutLocked)
            errors.timeoutLocked = 'Timeout locked reward required'
          if (isNaN(values.timeoutLocked))
            errors.timeoutLocked = 'Number Required'
          if (values.timeoutLocked <= 0)
            errors.timeoutLocked = 'Timeout locked must be positive.'

          return errors
        }}
        onSubmit={useCallback(async values => {
          const messageEncrypted = await EthCrypto.encryptWithPublicKey(
            identity.publicKey,
            JSON.stringify({
              type: values.type,
              description: values.description,
              contactInformation: values.contactInformation,
              rewardAmount: values.rewardAmount,
              timeoutLocked: values.timeoutLocked
            })
          )

          const enc = new TextEncoder()

          // Upload the description encrypted to IPFS
          const ipfsHashMetaEvidenceObj = await ipfsPublish(
            'metaEvidence.json',
            enc.encode(EthCrypto.cipher.stringify(messageEncrypted).toString())
          )

          await setIsMetaEvidencePublish(true)

          values.descriptionEncryptedIpfsUrl = `ipfs/${
            ipfsHashMetaEvidenceObj[1].hash
          }${ipfsHashMetaEvidenceObj[0].path}`

          values.itemID = drizzle.web3.utils.randomHex(16)

          values.addressForEncryption = EthCrypto.publicKey.toAddress(
            identity.publicKey
          )

          window.localStorage.setItem('recover', JSON.stringify({
            ...JSON.parse(localStorage.getItem('recover') || '{}'),
            [values.itemID.padEnd(65, '0')]: {
              owner: drizzleState.account,
              privateKey: identity.privateKey
            }
          }));

          addItem(values)
        })}
      >
        {({
          errors,
          setFieldValue,
          touched,
          isSubmitting,
          values,
          handleChange
        }) => (
          <>
            <StyledForm>
              <div>
                <label htmlFor="type">
                  Type
                </label>
                <StyledField
                  name="type"
                  placeholder="Type"
                />
                <ErrorMessage
                  name="type"
                  component="div"
                />
              </div>
              <div>
                <label htmlFor="description">
                  Description
                </label>
                <StyledField
                  name="description"
                  value={values.description}
                  render={({ field, form }) => (
                    <StyledTextarea
                      {...field}
                      minRows={10}
                      onChange={e => {
                        handleChange(e)
                        form.setFieldValue('description', e.target.value)
                      }}
                    />
                  )}
                />
                <ErrorMessage name="description" component="div" />
              </div>
              <div>
                <label htmlFor="contactInformation">
                  Contact Information
                </label>
                <StyledField
                  name="contactInformation"
                  value={values.contactInformation}
                  render={({ field, form }) => (
                    <StyledTextarea
                      {...field}
                      minRows={10}
                      onChange={e => {
                        handleChange(e)
                        form.setFieldValue('contactInformation', e.target.value)
                      }}
                    />
                  )}
                />
                <ErrorMessage name="contactInformation" component="div" />
              </div>
              <div>
                <label htmlFor="rewardAmount">
                  Amount (ETH)
                </label>
                <StyledField
                  name="rewardAmount"
                  placeholder="Amount reward"
                />
                <ErrorMessage
                  name="rewardAmount"
                  component="div"
                />
              </div>
              <div>
                <label htmlFor="timeoutLocked">
                  Time Locked
                </label>
                <StyledField
                  name="timeoutLocked"
                  placeholder="Timeout locked"
                />
                <ErrorMessage
                  name="timeoutLocked"
                  component="div"
                />
              </div>
              <div style={{textAlign: 'right'}}>
                <Button
                  type="submit"
                  disabled={Object.entries(errors).length > 0}
                  style={{padding: '0 30px', textAlign: 'center', lineHeight: '50px', border: '1px solid #14213D', borderRadius: '10px'}}
                >
                  Save Transaction →
                </Button>
              </div>
            </StyledForm>
            {/* <p>Private Key for encryption and recover: {identity.privateKey}</p> */}
            {status && status == 'pending' && <p><BounceLoader color={'#12D8FA'} size={30} style={{display: 'inline'}}/> {' '}Transaction pending</p>}
            {status && status !== 'pending' && (
              <>
                <p>Transaction ongoing</p>
                {(status === 'success' && isMetaEvidencePublish)
                  ? window.location.replace(
                      `/contract/${
                        process.env.REACT_APP_RECOVER_KOVAN_ADDRESS
                      }/items/${values.itemID}-privateKey=${identity.privateKey}`
                    )
                  : 'Error during the transaction.'}
              </>
            )}
          </>
        )}
      </Formik>
    </Container>
  )
}
