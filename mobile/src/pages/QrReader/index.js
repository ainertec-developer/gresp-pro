import { useNavigation } from '@react-navigation/native';

import { BarCodeScanner } from 'expo-barcode-scanner';
import React, { useEffect, useRef } from 'react';
import { KeyboardAvoidingView } from 'react-native';
import * as Yup from 'yup';
import { Button, Input, Label } from '../../components/Form';
import Scanner from '../../components/QrReader';
import { useOrder } from '../../contexts/order';
import { Container, Scroll, FormCode } from './styles';

export default function QrReader() {
  const formRef = useRef(null);
  const navigation = useNavigation();
  const { loadOrder, order } = useOrder();

  async function handleSubmit(data) {
    try {
      formRef.current.setErrors({});
      const schema = Yup.object().shape({
        identification: Yup.string().required('a identificão é obrigatória.'),
      });
      await schema.validate(data, {
        abortEarly: false,
      });
      await loadOrder(data.identification);
      navigation.navigate('Home');
    } catch (err) {
      if (err instanceof Yup.ValidationError) {
        const errorMessages = {};
        err.inner.forEach((error) => {
          errorMessages[error.path] = error.message;
        });
        formRef.current.setErrors(errorMessages);
      }
    }
  }

  useEffect(() => {
    async function loadIpAddress() {
      const identification = [order.identification].toString();
      if (identification) formRef.current.setData({ identification });
    }
    loadIpAddress();
  }, []);

  return (
    <Container>
      <KeyboardAvoidingView
        style={{ flex: 1, flexDirection: 'column', justifyContent: 'center' }}
        behavior='height'
        enable
        keyboardVerticalOffset={100}
      >
        <Scroll>
          <Scanner formRef={formRef} cameraSide />

          <FormCode ref={formRef} onSubmit={handleSubmit}>
            <Label>Identificação:</Label>
            <Input
              name='identification'
              iconName='leak-add'
              placeholder='Digite a identificação'
              keyboardType='numeric'
            />
            <Button
              style={{ backgroundColor: '#e72847' }}
              onPress={() => formRef.current.submitForm()}
            />
          </FormCode>
        </Scroll>
      </KeyboardAvoidingView>
    </Container>
  );
}
