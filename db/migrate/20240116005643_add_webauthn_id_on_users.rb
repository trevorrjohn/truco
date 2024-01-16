class AddWebauthnIdOnUsers < ActiveRecord::Migration[7.2]
  def change
    change_table :users, bulk: true do |t|
      t.text :webauthn_id
      t.remove :token, type: :string
    end
  end
end
