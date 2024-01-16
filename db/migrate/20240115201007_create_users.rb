class CreateUsers < ActiveRecord::Migration[7.2]
  def change
    create_table :users, id: :uuid do |t|
      t.text :email, null: false
      t.datetime :verified_at
      t.string :token
      t.string :name, null: false
      t.index :email, unique: true

      t.timestamps
    end
  end
end
