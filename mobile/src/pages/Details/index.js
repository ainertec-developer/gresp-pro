import React, { useState } from 'react';
import { MaterialIcons } from '@expo/vector-icons';
import { useRoute } from '@react-navigation/native';

import ActionButton from '../../components/ActionButton';
import PaymentModal from '../../components/PaymentModal';
import FeeModal from '../../components/FeeModal';
import {
  Container,
  Title,
  Header,
  HeaderLine,
  HeaderText,
  HeaderTextLine,
  List,
  Item,
} from './styles';

const Details = () => {
  const [order,setOrderPayment ] = useState(useRoute().params);
  const [showFee, setShowFee] = useState(false);
  const [showPay, setShowPay] = useState(false);
  const [changed, setChanged] = useState(false);

  async function handleFee() {
    if (order.total === undefined || changed === true)
    return Alert.alert('Ops!', 'Crie ou atualize o pedido para paga-lo!');
    setShowFee(true);
  }

  async function handlePayment() {
    if (order.total === undefined || changed === true)
      return Alert.alert('Ops!', 'Crie ou atualize o pedido para paga-lo!');
    setShowPay(true);
  }

  return (
    <Container>
      <Title>Detalhes do Pedido</Title>
      <Header>
        <HeaderLine>
          <HeaderTextLine>Identificação: {order.identification}</HeaderTextLine>
          <HeaderTextLine>Total: R$ {order.total.toFixed(2)}</HeaderTextLine>
        </HeaderLine>

        <HeaderText>
          Observações:{' '}
          {order.note === '' || !order.note ? 'Nenhuma ' : order.note}
        </HeaderText>
      </Header>
      <List
        data={order.items}
        keyExtractor={(item) => String(item.product._id)}
        renderItem={({ item }) => (
          <Item
            leftIcon={{
              name: item.product.drink ? 'local-drink' : 'restaurant',
              color: '#000',
              size: 26,
            }}
            title={item.product.name}
            rightTitle={item.courtesy ? 'Cortesia' : `R$ ${item.product.price}`}
            subtitle={item.product.description}
            rightSubtitle={`Quant. ${item.quantity}`}
          />
        )}
      />
      <ActionButton onPress={handleFee} background>
        <MaterialIcons
          size={56}
          reverse
          raised
          color='#a46810'
          name='monetization-on'
          onPress={handleFee}
        />
      </ActionButton>
      <FeeModal showFee={showFee} setShowPay={setShowPay} setOrderPayment={setOrderPayment} setShowFee={setShowFee} order={order} />
      <PaymentModal
        showPay={showPay}
        setShowPay={setShowPay}
        order={order}
        goBack
      />
    </Container>
  );
};

export default Details;
