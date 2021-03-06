/* eslint-disable array-callback-return */
import { Request, Response } from 'express';

import { Document } from 'mongoose';
import { ItemInterface, CustomRequest } from '../interfaces/base';

import Order from '../models/Order';
import Item from '../models/Item';

interface ItemsInterface extends Document {
  product: ItemInterface;
  quantity: number;
  courtesy: boolean;
}

class OrderController {
  public constructor() {
    this.create = this.create.bind(this);
    this.update = this.update.bind(this);
  }

  private async getOrderTotalAndAlert(items: ItemsInterface[]) {
    let total = 0;
    const alert = Array<string>();

    await Promise.all(
      items.map(async item => {
        const consumedItem = await Item.findOne({ _id: item.product }).populate(
          'ingredients.material',
        );
        if (consumedItem) {
          if (consumedItem.stock && consumedItem.stock <= 10)
            alert.push(consumedItem.name);
          if (consumedItem.ingredients) {
            consumedItem.ingredients.map(ingredient => {
              if (ingredient.material.stock <= 10) {
                alert.push(consumedItem.name);
              }
            });
          }
          total += item.courtesy ? 0 : consumedItem.price * item.quantity;
        }
      }),
    );
    return { total, alert };
  }

  public async create(req: CustomRequest, res: Response) {
    const { identification, items, note } = req.body;

    if (await Order.findOne({ identification, closed: false }))
      return res.status(400).json('Order already exist');

    const orderInformations = await this.getOrderTotalAndAlert(items);
    const finalPrice = orderInformations.total;

    const order = await Order.create({
      identification,
      items,
      total: Number(finalPrice.toFixed(2)),
      note,
      finished: false,
    });

    await order.populate('items.product').execPopulate();

    req.io.emit('newOrder', order);
    return res.json({
      order,
      stockAlert:
        orderInformations.alert.length === 0
          ? undefined
          : orderInformations.alert,
    });
  }

  public async update(req: CustomRequest, res: Response) {
    const { items, note } = req.body;
    const identification = Number(req.params.identification);

    const orderInformations = await this.getOrderTotalAndAlert(items);
    const finalPrice = orderInformations.total;

    const order = await Order.findOneAndUpdate(
      { identification, closed: false },
      {
        identification,
        items,
        total: Number(finalPrice.toFixed(2)),
        note,
      },
      {
        new: false,
      },
    );

    const newOrder = await Order.findOne({
      identification,
      closed: false,
    }).populate('items.product');

    if (!order) return res.status(400).json('identification does not exist');

    // await order.populate('items.product').execPopulate();

    req.io.emit('updatedOrder', newOrder);
    return res.json({
      order: newOrder,
      oldItems: order.items,
      stockAlert:
        orderInformations.alert.length === 0
          ? undefined
          : orderInformations.alert,
    });
  }

  public async delete(req: CustomRequest, res: Response) {
    const identification = Number(req.params.identification);
    const { payment } = req.params;

    const order = await Order.findOneAndUpdate(
      { identification, closed: false },
      { closed: true, payment },
      { new: true },
    );
    req.io.emit('payment', order);
    return res.json('Order was closed with success!');
  }

  public async deleteOne(req: Request, res: Response) {
    const { id } = req.params;

    await Order.deleteOne({ _id: id });

    return res.status(200).send();
  }

  public async index(req: Request, res: Response) {
    const orders = await Order.find({ closed: false }).populate(
      'items.product',
    );

    return res.json(orders);
  }

  public async show(req: Request, res: Response) {
    const identification = Number(req.params.identification);
    const order = await Order.findOne({
      identification,
      closed: false,
    }).populate('items.product');

    return res.json(order);
  }

  public async addFees(req: CustomRequest, res: Response){
    const { tip, cardfee } = req.body;
    const identification = Number(req.params.identification);

    const order = await Order.findOneAndUpdate(
      { identification, closed: false },
      {
        tip,
        cardfee,
      },
      {
        new: false,
      },
    );

    const newOrder = await Order.findOne({
      identification,
      closed: false,
    }).populate('items.product');

    if (!order) return res.status(400).json('identification does not exist');

    // await order.populate('items.product').execPopulate();

    req.io.emit('updatedOrder', newOrder);
    return res.json({
      order: newOrder
    });
  }
}


export default new OrderController();
