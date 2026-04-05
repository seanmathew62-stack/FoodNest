CREATE TABLE users (
  id VARCHAR2(50) PRIMARY KEY,
  name VARCHAR2(100) NOT NULL,
  username VARCHAR2(100) UNIQUE NOT NULL,
  password_hash VARCHAR2(255) NOT NULL,
  role VARCHAR2(20) CHECK (role IN ('student', 'cook', 'delivery')) NOT NULL,
  nest_coins NUMBER DEFAULT 0 NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE user_sessions (
  id VARCHAR2(50) PRIMARY KEY,
  user_id VARCHAR2(50) NOT NULL,
  token VARCHAR2(100) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_sessions_user FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE menu_items (
  id VARCHAR2(50) PRIMARY KEY,
  name VARCHAR2(100) NOT NULL,
  category VARCHAR2(30) NOT NULL,
  price_nest_coins NUMBER NOT NULL,
  description VARCHAR2(255),
  available NUMBER(1) DEFAULT 1 CHECK (available IN (0,1))
);

CREATE TABLE orders (
  id VARCHAR2(50) PRIMARY KEY,
  student_id VARCHAR2(50) NOT NULL,
  total_nest_coins NUMBER NOT NULL,
  payment_method VARCHAR2(30) NOT NULL,
  payment_status VARCHAR2(30) NOT NULL,
  status VARCHAR2(50) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_orders_student FOREIGN KEY (student_id) REFERENCES users(id)
);

CREATE TABLE order_items (
  id VARCHAR2(50) PRIMARY KEY,
  order_id VARCHAR2(50) NOT NULL,
  menu_item_id VARCHAR2(50) NOT NULL,
  quantity NUMBER NOT NULL,
  unit_price_nest_coins NUMBER NOT NULL,
  line_total_nest_coins NUMBER NOT NULL,
  CONSTRAINT fk_order_items_order FOREIGN KEY (order_id) REFERENCES orders(id),
  CONSTRAINT fk_order_items_menu FOREIGN KEY (menu_item_id) REFERENCES menu_items(id)
);

CREATE TABLE order_status_history (
  id VARCHAR2(50) PRIMARY KEY,
  order_id VARCHAR2(50) NOT NULL,
  stage VARCHAR2(50) NOT NULL,
  changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  simulated NUMBER(1) DEFAULT 1 CHECK (simulated IN (0,1)),
  CONSTRAINT fk_status_order FOREIGN KEY (order_id) REFERENCES orders(id)
);

CREATE TABLE feedback (
  id VARCHAR2(50) PRIMARY KEY,
  order_id VARCHAR2(50) UNIQUE NOT NULL,
  rating NUMBER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_feedback_order FOREIGN KEY (order_id) REFERENCES orders(id)
);

INSERT INTO menu_items (id, name, category, price_nest_coins, description, available)
VALUES ('meal-1', 'Home Veg Thali', 'Veg', 80, 'Rice, dal, sabzi, roti, and salad.', 1);

INSERT INTO menu_items (id, name, category, price_nest_coins, description, available)
VALUES ('meal-2', 'Paneer Lunch Box', 'Veg', 110, 'Paneer curry with jeera rice and roti.', 1);

INSERT INTO menu_items (id, name, category, price_nest_coins, description, available)
VALUES ('meal-3', 'Chicken Combo', 'Non-Veg', 140, 'Chicken curry with rice and salad.', 1);

COMMIT;

